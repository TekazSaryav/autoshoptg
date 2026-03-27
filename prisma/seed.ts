import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "electronics" },
      update: {},
      create: { slug: "electronics", name: "Électronique", description: "Appareils et accessoires" }
    }),
    prisma.category.upsert({
      where: { slug: "home" },
      update: {},
      create: { slug: "home", name: "Maison", description: "Articles utiles pour la maison" }
    })
  ]);

  await prisma.product.upsert({
    where: { sku: "NB-HEADSET-001" },
    update: {},
    create: {
      categoryId: categories[0].id,
      sku: "NB-HEADSET-001",
      title: "Casque Bluetooth Nova",
      description: "Casque sans fil avec réduction de bruit, autonomie 30h.",
      priceCents: 8999,
      stock: 30,
      images: { create: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e", position: 0 }] }
    }
  });

  await prisma.product.upsert({
    where: { sku: "NB-LAMP-002" },
    update: {},
    create: {
      categoryId: categories[1].id,
      sku: "NB-LAMP-002",
      title: "Lampe de bureau minimaliste",
      description: "Éclairage LED réglable, design épuré.",
      priceCents: 4599,
      stock: 50,
      images: { create: [{ url: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15", position: 0 }] }
    }
  });

  await prisma.setting.upsert({
    where: { key: "shop" },
    update: { value: { currency: "EUR", supportHours: "Mon-Fri 09:00-18:00" } },
    create: { key: "shop", value: { currency: "EUR", supportHours: "Mon-Fri 09:00-18:00" } }
  });

  await prisma.user.upsert({
    where: { telegramId: BigInt(100000000) },
    update: { role: UserRole.ADMIN },
    create: {
      telegramId: BigInt(100000000),
      username: "admin_demo",
      firstName: "Admin",
      role: UserRole.ADMIN
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
