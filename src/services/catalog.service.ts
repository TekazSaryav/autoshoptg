import { prisma } from "../lib/prisma.js";

export const catalogService = {
  listCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });
  },

  listProductsByCategory(categoryId: string) {
    return prisma.product.findMany({
      where: { categoryId, isActive: true },
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: [{ stock: "desc" }, { createdAt: "desc" }]
    });
  },

  getProduct(productId: string) {
    return prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: { images: { orderBy: { position: "asc" } }, category: true }
    });
  }
};
