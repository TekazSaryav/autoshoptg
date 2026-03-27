import { prisma } from "../lib/prisma.js";

export const cartService = {
  async getOrCreateCart(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: { include: { product: true } } }
    });
  },

  async addItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product || !product.isActive || product.stock < quantity) {
      throw new Error("PRODUCT_NOT_AVAILABLE");
    }

    await prisma.cartItem.upsert({
      where: { cartId_productId_variantKey: { cartId: cart.id, productId, variantKey: null } },
      update: { quantity: { increment: quantity }, unitPriceCts: product.priceCents },
      create: { cartId: cart.id, productId, quantity, unitPriceCts: product.priceCents }
    });

    return this.getOrCreateCart(userId);
  },

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    } else {
      await prisma.cartItem.updateMany({ where: { id: itemId, cartId: cart.id }, data: { quantity } });
    }
    return this.getOrCreateCart(userId);
  },

  async clear(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
};
