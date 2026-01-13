'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-server';

export async function getAdminStats() {
  const session = await getSession();
  if (session?.user?.role !== 'admin') return { error: 'Non autorisé' };

  try {
    const [
      totalDeliveries,
      activeCouriers,
      deliveryPoints,
      totalClients,
      recentDeliveries,
    ] = await Promise.all([
      prisma.delivery.count({}),
      prisma.user.count({ where: { role: 'courier' } }),
      prisma.deliveryPoint.count({}),
      prisma.user.count({ where: { role: 'client' } }),
      prisma.delivery.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
          deliveryPoint: { select: { description: true } },
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalDeliveries,
        activeCouriers,
        deliveryPoints,
        totalClients,
      },
      recentDeliveries: recentDeliveries.map((d) => ({
        id: d.id,
        client: d.client.name,
        status: d.status,
        zone: d.deliveryPoint.description || 'Inconnue',
        createdAt: d.createdAt,
      })),
    };
  } catch (e) {
    console.error('Failed to fetch admin stats', e);
    return { error: 'Erreur lors de la récupération des statistiques' };
  }
}
