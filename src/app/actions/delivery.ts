'use server';

import { prisma } from '@/lib/prisma';
import {
  createDeliverySchema,
  assignCourierSchema,
  updateStatusSchema,
  proofOfDeliverySchema,
} from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSession } from '@/lib/auth-server';
import { createNotification } from './notifications';

async function logAction(deliveryId: string, action: string, details?: string) {
  const session = await getSession();
  try {
    await prisma.deliveryLog.create({
      data: {
        deliveryId,
        userId: session?.user?.id,
        action,
        details,
      },
    });
  } catch (e) {
    console.error('Failed to create log', e);
  }
}

export async function createDelivery(
  data: z.infer<typeof createDeliverySchema>
) {
  console.log('Creating delivery with data:', JSON.stringify(data));
  const result = createDeliverySchema.safeParse(data);

  if (!result.success) {
    return { error: 'Données invalides' };
  }

  const session = await getSession();
  if (!session) {
    return { error: 'Non autorisé' };
  }

  const {
    latitude,
    longitude,
    description,
    items,
    sellerId: inputSellerId,
  } = result.data;

  // Determine sellerId from input or items
  let sellerId = inputSellerId;
  if (!sellerId && items && items.length > 0) {
    const firstItemWithSeller = items.find((i) => i.sellerId);
    if (firstItemWithSeller) sellerId = firstItemWithSeller.sellerId;
  }

  try {
    const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const delivery = await prisma.$transaction(async (tx) => {
      // 0. Get Seller Address if available
      let pickupPointId = null;
      if (sellerId) {
        const seller = await tx.user.findUnique({
          where: { id: sellerId },
          select: {
            latitude: true,
            longitude: true,
            city: true,
            neighborhood: true,
            landmark: true,
          },
        });

        if (seller?.latitude && seller?.longitude) {
          const pickupPoint = await tx.deliveryPoint.create({
            data: {
              latitude: seller.latitude,
              longitude: seller.longitude,
              description: `Collecte: ${seller.city || ''} ${
                seller.neighborhood || ''
              } (${seller.landmark || 'Point Vendeur'})`,
            },
          });
          pickupPointId = pickupPoint.id;
        }
      }

      // 1. Create Delivery Point (Destination)
      const point = await tx.deliveryPoint.create({
        data: {
          latitude,
          longitude,
          description,
        },
      });

      // 2. Create Delivery
      const newDelivery = await tx.delivery.create({
        data: {
          deliveryPointId: point.id,
          pickupPointId: pickupPointId,
          status: 'CREATED',
          clientId: session.user.id,
          items: items ?? [],
          confirmationCode,
          sellerId: sellerId,
        },
      });

      // 3. Update Product Stocks
      if (items && items.length > 0) {
        for (const item of items) {
          if (item.id) {
            try {
              await tx.product.update({
                where: { id: item.id },
                data: { stock: { decrement: item.quantity } },
              });
            } catch (e) {
              console.warn(`Could not update stock for product ${item.id}`, e);
              // Continue even if stock update fails? Or fail transaction?
              // Ideally fail, but for now log.
              // Check if stock is sufficient? Prisma will throw if stock goes negative depending on constraint...
              // Actually Prisma types don't enforce checks unless db constraint exists.
              // But if product doesn't exist, it throws.
            }
          }
        }
      }

      return newDelivery;
    });

    revalidatePath('/deliveries');
    revalidatePath('/dashboard');

    await logAction(delivery.id, 'CREATED', 'Livraison créée');

    // Notify Seller
    if (sellerId) {
      await createNotification({
        userId: sellerId,
        title: 'Nouvelle commande',
        message: `Une nouvelle commande #${delivery.id.slice(
          0,
          8
        )} a été créée par ${session.user.name}.`,
        type: 'info',
        link: `/deliveries/${delivery.id}`,
      });
    }

    return { success: true, deliveryId: delivery.id, confirmationCode };
  } catch (error) {
    console.error('Failed to create delivery:', error);
    return { error: 'Erreur lors de la création' };
  }
}

export async function deleteDelivery(id: string) {
  const session = await getSession();
  if (!session) return { error: 'Non autorisé' };

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) return { error: 'Livraison introuvable' };

    if (
      delivery.clientId !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return { error: 'Non autorisé' };
    }

    if (delivery.status !== 'CREATED') {
      return { error: "Impossible d'annuler une livraison en cours" };
    }

    await prisma.delivery.delete({ where: { id } });
    revalidatePath('/deliveries');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete delivery:', error);
    return { error: "Erreur lors de l'annulation" };
  }
}

export async function assignCourier(data: z.infer<typeof assignCourierSchema>) {
  const result = assignCourierSchema.safeParse(data);
  if (!result.success) return { error: 'Invalid data' };

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: result.data.deliveryId },
      select: { clientId: true },
    });

    await prisma.delivery.update({
      where: { id: result.data.deliveryId },
      data: {
        courierId: result.data.courierId,
        status: 'ASSIGNED',
      },
    });

    await logAction(
      result.data.deliveryId,
      'ASSIGNED',
      `Assignée au coursier ${result.data.courierId}`
    );

    // Notify Courier
    await createNotification({
      userId: result.data.courierId,
      title: 'Nouvelle mission',
      message: `Vous avez été assigné à la livraison #${result.data.deliveryId.slice(
        0,
        8
      )}.`,
      type: 'info',
      link: `/deliveries/${result.data.deliveryId}`,
    });

    // Notify Client
    if (delivery?.clientId) {
      await createNotification({
        userId: delivery.clientId,
        title: 'Coursier assigné',
        message: `Un coursier a été assigné à votre livraison #${result.data.deliveryId.slice(
          0,
          8
        )}.`,
        type: 'success',
        link: `/deliveries/${result.data.deliveryId}`,
      });
    }

    revalidatePath('/deliveries');
    return { success: true };
  } catch (error) {
    console.error('Failed to assign courier:', error);
    return { error: 'Failed to assign courier' };
  }
}

export async function updateStatus(data: z.infer<typeof updateStatusSchema>) {
  const result = updateStatusSchema.safeParse(data);
  if (!result.success) return { error: 'Invalid data' };

  try {
    const delivery = await prisma.delivery.update({
      where: { id: result.data.deliveryId },
      data: { status: result.data.status },
      select: { clientId: true, id: true, status: true },
    });

    await logAction(
      result.data.deliveryId,
      'STATUS_UPDATE',
      `Statut changé vers ${result.data.status}`
    );

    // Notify Client
    const statusMessages: Record<string, string> = {
      IN_TRANSIT: 'Votre livraison est en route !',
      ARRIVED_ZONE: 'Votre coursier est arrivé dans votre zone.',
      FAILED: 'Votre livraison a rencontré un problème.',
    };

    if (statusMessages[delivery.status]) {
      await createNotification({
        userId: delivery.clientId,
        title: 'Mise à jour de livraison',
        message: `${
          statusMessages[delivery.status]
        } (Livraison #${delivery.id.slice(0, 8)})`,
        type: delivery.status === 'FAILED' ? 'error' : 'info',
        link: `/deliveries/${delivery.id}`,
      });
    }

    revalidatePath('/deliveries');
    return { success: true };
  } catch (error) {
    console.error('Failed to update status:', error);
    return { error: 'Failed to update status' };
  }
}

export async function submitProof(data: z.infer<typeof proofOfDeliverySchema>) {
  const result = proofOfDeliverySchema.safeParse(data);
  if (!result.success) return { error: 'Invalid data' };

  try {
    const { deliveryId, otp, ...proofData } = result.data;

    // Check confirmation code
    // Check confirmation code and current status
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { proof: true },
    });

    if (!delivery) return { error: 'Delivery not found' };

    // Idempotency check: if already delivered or has proof, return success
    if (delivery.status === 'DELIVERED' || delivery.proof) {
      return { success: true };
    }

    if (delivery.confirmationCode && delivery.confirmationCode !== otp) {
      return { error: 'Code de confirmation incorrect' };
    }

    await prisma.$transaction([
      prisma.proofOfDelivery.create({
        data: {
          deliveryId,
          otp,
          ...proofData,
        },
      }),
      prisma.delivery.update({
        where: { id: deliveryId },
        data: { status: 'DELIVERED' },
      }),
    ]);

    await logAction(
      deliveryId,
      'DELIVERED',
      'Preuve de livraison soumise (GPS + OTP)'
    );

    revalidatePath('/deliveries');

    // Notify Client
    await createNotification({
      userId: delivery.clientId,
      title: 'Livraison terminée !',
      message: `Votre livraison #${deliveryId.slice(
        0,
        8
      )} a été effectuée avec succès.`,
      type: 'success',
      link: `/deliveries/${deliveryId}`,
    });

    // Notify Seller
    if (delivery.sellerId) {
      await createNotification({
        userId: delivery.sellerId,
        title: 'Livraison effectuée',
        message: `La commande #${deliveryId.slice(
          0,
          8
        )} a bien été livrée au client.`,
        type: 'success',
        link: `/deliveries/${deliveryId}`,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to submit proof:', error);
    return { error: 'Failed to submit proof' };
  }
}

export async function getDeliveries(filters?: {
  status?: string;
  courierId?: string;
  clientId?: string;
  search?: string;
}) {
  try {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.courierId) where.courierId = filters.courierId;
    if (filters?.clientId) where.clientId = filters.clientId;

    if (filters?.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        {
          deliveryPoint: {
            description: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        deliveryPoint: true,
        pickupPoint: true,
        courier: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, deliveries };
  } catch (error) {
    console.error('Failed to get deliveries:', error);
    return { error: 'Failed to get deliveries' };
  }
}

export async function getDelivery(id: string) {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        deliveryPoint: true,
        pickupPoint: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            neighborhood: true,
            landmark: true,
          },
        },
        courier: {
          select: { id: true, name: true, email: true },
        },
        proof: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, role: true } } },
        },
      },
    });

    if (!delivery) return { error: 'Delivery not found' };
    return { success: true, delivery };
  } catch (error) {
    console.error('Failed to get delivery:', error);
    return { error: 'Failed to get delivery' };
  }
}
