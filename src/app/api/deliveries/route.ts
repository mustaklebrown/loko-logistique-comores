import { prisma } from '@/lib/prisma';
import { createDeliverySchema } from '@/lib/schemas';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const courierId = searchParams.get('courierId');

    const where: any = {};
    if (status) where.status = status;
    if (courierId) where.courierId = courierId;

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        deliveryPoint: true,
        courier: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(deliveries);
  } catch (error) {
    console.error('Failed to fetch deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = createDeliverySchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error },
        { status: 400 }
      );
    }

    const { latitude, longitude, description } = result.data;

    // Transaction to ensure atomicity
    const delivery = await prisma.$transaction(async (tx) => {
      const point = await tx.deliveryPoint.create({
        data: {
          latitude,
          longitude,
          description,
        },
      });

      return await tx.delivery.create({
        data: {
          deliveryPointId: point.id,
          status: 'CREATED',
        },
      });
    });

    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error('Failed to create delivery:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery' },
      { status: 500 }
    );
  }
}
