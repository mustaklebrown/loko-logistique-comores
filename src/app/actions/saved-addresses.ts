'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

export async function getSavedAddresses() {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    const addresses = await prisma.savedAddress.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, addresses };
  } catch (e) {
    console.error('Failed to fetch addresses', e);
    return { error: 'Erreur lors de la récupération des adresses' };
  }
}

export async function createSavedAddress(data: {
  label: string;
  city?: string;
  neighborhood?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    const address = await prisma.savedAddress.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });
    revalidatePath('/profile');
    revalidatePath('/', 'layout');
    return { success: true, address };
  } catch (e) {
    console.error('Failed to create address', e);
    return { error: "Erreur lors de la création de l'adresse" };
  }
}

export async function deleteSavedAddress(id: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    await prisma.savedAddress.delete({
      where: {
        id,
        userId: session.user.id, // Security check
      },
    });
    revalidatePath('/profile');
    return { success: true };
  } catch (e) {
    console.error('Failed to delete address', e);
    return { error: 'Erreur lors de la suppression' };
  }
}
