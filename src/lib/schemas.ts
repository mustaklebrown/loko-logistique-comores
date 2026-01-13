import { z } from 'zod';

export const createDeliverySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().optional(),
  photo: z.any().optional(), // File list or similar
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        image: z.string().optional(),
        sellerId: z.string().optional(),
      })
    )
    .optional(),
  sellerId: z.string().optional(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;

export const assignCourierSchema = z.object({
  deliveryId: z.string(),
  courierId: z.string(),
});

export const updateStatusSchema = z.object({
  deliveryId: z.string(),
  status: z.enum([
    'CREATED',
    'ASSIGNED',
    'IN_TRANSIT',
    'ARRIVED_ZONE',
    'DELIVERED',
    'FAILED',
  ]),
});

export const proofOfDeliverySchema = z.object({
  deliveryId: z.string(),
  photoUrl: z.string().optional(),
  signature: z.string().optional(),
  otp: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});
