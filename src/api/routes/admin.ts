import { OrderStatus, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const adminRouter = Router();

const categorySchema = z.object({ slug: z.string().min(2).max(100), name: z.string().min(2).max(100), description: z.string().max(500).optional() });
const productSchema = z.object({
  categoryId: z.string().min(10),
  sku: z.string().min(2).max(60),
  title: z.string().min(2).max(140),
  description: z.string().min(2).max(2000),
  priceCents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional()
});

adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({ take: 100, orderBy: { createdAt: "desc" } });
  res.json(users);
});

adminRouter.patch("/users/:id/role", async (req, res) => {
  const role = z.nativeEnum(UserRole).parse(req.body.role);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json(user);
});

adminRouter.post("/categories", async (req, res) => {
  const payload = categorySchema.parse(req.body);
  const category = await prisma.category.create({ data: payload });
  res.json(category);
});

adminRouter.get("/categories", async (_req, res) => {
  res.json(await prisma.category.findMany({ orderBy: { createdAt: "desc" } }));
});

adminRouter.patch("/categories/:id", async (req, res) => {
  const payload = categorySchema.partial().parse(req.body);
  res.json(await prisma.category.update({ where: { id: req.params.id }, data: payload }));
});

adminRouter.delete("/categories/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

adminRouter.post("/products", async (req, res) => {
  const payload = productSchema.parse(req.body);
  const created = await prisma.product.create({
    data: {
      categoryId: payload.categoryId,
      sku: payload.sku,
      title: payload.title,
      description: payload.description,
      priceCents: payload.priceCents,
      stock: payload.stock,
      images: payload.imageUrl ? { create: [{ url: payload.imageUrl, position: 0 }] } : undefined
    },
    include: { images: true }
  });
  res.json(created);
});

adminRouter.get("/products", async (_req, res) => {
  res.json(await prisma.product.findMany({ include: { category: true }, take: 200, orderBy: { createdAt: "desc" } }));
});

adminRouter.patch("/products/:id", async (req, res) => {
  const payload = productSchema.partial().parse(req.body);
  res.json(await prisma.product.update({ where: { id: req.params.id }, data: payload }));
});

adminRouter.delete("/products/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

adminRouter.get("/orders", async (_req, res) => {
  res.json(await prisma.order.findMany({ include: { user: true, items: true, payments: true }, take: 100, orderBy: { createdAt: "desc" } }));
});

adminRouter.patch("/orders/:id/status", async (req, res) => {
  const status = z.nativeEnum(OrderStatus).parse(req.body.status);
  res.json(await prisma.order.update({ where: { id: req.params.id }, data: { status } }));
});

adminRouter.get("/orders/search", async (req, res) => {
  const q = z.string().min(2).parse(req.query.q);
  const order = await prisma.order.findFirst({ where: { OR: [{ id: q }, { orderNumber: q }] }, include: { items: true, payments: true } });
  res.json(order);
});
