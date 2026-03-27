import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cartService } from "./cart.service.js";

const genOrderNumber = () => `ORD-${Date.now().toString().slice(-8)}`;

export const orderService = {
  async checkout(userId: string) {
    const cart = await cartService.getOrCreateCart(userId);
    if (cart.items.length === 0) throw new Error("EMPTY_CART");

    const subtotal = cart.items.reduce((acc, item) => acc + item.unitPriceCts * item.quantity, 0);

    const order = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");
        await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: item.quantity } } });
      }

      const createdOrder = await tx.order.create({
        data: {
          orderNumber: genOrderNumber(),
          userId,
          status: OrderStatus.PENDING,
          subtotalCents: subtotal,
          totalCents: subtotal,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              title: item.product.title,
              quantity: item.quantity,
              unitPriceCts: item.unitPriceCts,
              totalPriceCts: item.unitPriceCts * item.quantity
            }))
          },
          payments: {
            create: {
              method: PaymentMethod.MANUAL,
              status: PaymentStatus.PENDING,
              amountCents: subtotal
            }
          }
        },
        include: { items: true, payments: true }
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return createdOrder;
    });

    return order;
  },

  listUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { items: true, payments: true },
      orderBy: { createdAt: "desc" },
      take: 10
    });
  },

  listAdminOrders() {
    return prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { user: true } });
  },

  async updateStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({ where: { id: orderId }, data: { status } });
  }
};
