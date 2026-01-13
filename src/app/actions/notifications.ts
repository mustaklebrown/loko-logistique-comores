'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return { success: true, notifications, unreadCount };
  } catch (e) {
    return { error: 'Erreur lors de la récupération des notifications' };
  }
}

export async function markAsRead(id: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    await prisma.notification.update({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { error: 'Erreur lors de la mise à jour' };
  }
}

export async function markAllAsRead() {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { error: 'Erreur lors de la mise à jour' };
  }
}

export async function deleteNotification(id: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  try {
    await prisma.notification.delete({
      where: { id, userId: session.user.id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { error: 'Erreur lors de la suppression' };
  }
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}) {
  // This can be called from other server actions
  try {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        link: data.link,
      },
    });
    return { success: true };
  } catch (e) {
    console.error('Failed to create notification', e);
    return { error: 'Failed to create notification' };
  }
}
