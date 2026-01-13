'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().min(0),
  image: z.string().optional(),
});

export async function createProduct(data: z.infer<typeof productSchema>) {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    await prisma.product.create({
      data: {
        ...data,
        sellerId: session.user.id,
      },
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { error: 'Erreur lors de la création du produit' };
  }
}

export async function updateProduct(
  id: string,
  data: Partial<z.infer<typeof productSchema>>
) {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.sellerId !== session.user.id)
      return { error: 'Non autorisé' };

    await prisma.product.update({
      where: { id },
      data,
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { error: 'Erreur lors de la mise à jour' };
  }
}

export async function getSellerProducts() {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    const products = await prisma.product.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, products };
  } catch (e) {
    return { error: 'Erreur lors de la récupération des produits' };
  }
}

export async function getSellerStats() {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    const products = await prisma.product.count({
      where: { sellerId: session.user.id },
    });

    // Count orders that are completed
    const sales = await prisma.delivery.count({
      where: { sellerId: session.user.id, status: 'DELIVERED' },
    });

    const deliveries = await prisma.delivery.findMany({
      where: { sellerId: session.user.id, status: 'DELIVERED' },
      select: { items: true },
    });

    let revenue = 0;
    let totalItemsSold = 0;

    deliveries.forEach((d) => {
      const items = d.items as any[];
      if (Array.isArray(items)) {
        items.forEach((item) => {
          revenue += item.price * item.quantity;
          totalItemsSold += item.quantity;
        });
      }
    });

    return {
      success: true,
      stats: { products, sales, revenue, totalItemsSold },
    };
  } catch (e) {
    return { error: 'Erreur lors de la récupération des statistiques' };
  }
}

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      include: { seller: { select: { name: true } } },
    });
    return { success: true, products };
  } catch (e) {
    console.error('Failed to fetch products', e);
    return { error: 'Erreur lors de la récupération des produits' };
  }
}

export async function getAllProductsAdmin() {
  const session = await getSession();
  if (session?.user?.role !== 'admin') return { error: 'Non autorisé' };

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { seller: { select: { name: true, email: true } } },
    });
    return { success: true, products };
  } catch (e) {
    console.error('Failed to fetch admin products', e);
    return { error: 'Erreur lors de la récupération des produits' };
  }
}

export async function getSellerDeliveries() {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    const deliveries = await prisma.delivery.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true, email: true } },
        courier: { select: { name: true } },
        deliveryPoint: { select: { description: true } },
      },
    });
    return { success: true, deliveries };
  } catch (e) {
    console.error('Failed to fetch seller deliveries', e);
    return { error: 'Erreur lors de la récupération des livraisons' };
  }
}

export async function deleteProduct(id: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return { error: 'Produit introuvable' };

    // Only seller or admin can delete
    if (product.sellerId !== session.user.id && session.user.role !== 'admin') {
      return { error: 'Non autorisé' };
    }

    await prisma.product.delete({ where: { id } });
    revalidatePath('/dashboard');
    revalidatePath('/marketplace');
    revalidatePath('/shop');
    return { success: true };
  } catch (e) {
    return { error: 'Erreur lors de la suppression' };
  }
}
