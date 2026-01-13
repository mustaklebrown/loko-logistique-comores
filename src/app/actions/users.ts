'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

export async function getCouriers() {
  try {
    const couriers = await prisma.user.findMany({
      where: { role: { in: ['courier', 'COURIER'] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });
    return { success: true, couriers };
  } catch (error) {
    console.error('Failed to fetch couriers:', error);
    return { error: 'Failed to fetch couriers' };
  }
}

export async function updateUser(data: {
  name?: string;
  phone?: string;
  image?: string;
  city?: string;
  neighborhood?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
    revalidatePath('/profile');
    return { success: true };
  } catch (e) {
    console.error('Failed to update user', e);
    return { error: 'Erreur lors de la mise à jour' };
  }
}

export async function getUserLogs() {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    const logs = await prisma.deliveryLog.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // Logs created by this user
          { delivery: { clientId: session.user.id } }, // Logs for client's deliveries
          { delivery: { courierId: session.user.id } }, // Logs for courier's deliveries
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { delivery: true },
    });
    return { success: true, logs };
  } catch (e) {
    console.error('Failed to fetch logs', e);
    return { error: "Erreur lors de la récupération de l'historique" };
  }
}

export async function getAllUsers() {
  const session = await getSession();
  if (session?.user?.role !== 'admin') return { error: 'Non autorisé' };

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });
    return { success: true, users };
  } catch (e) {
    return { error: 'Erreur lors de la récupération des utilisateurs' };
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  const session = await getSession();
  if (session?.user?.role !== 'admin') return { error: 'Non autorisé' };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { error: 'Erreur lors de la mise à jour du rôle' };
  }
}
