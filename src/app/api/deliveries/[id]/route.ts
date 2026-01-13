import { prisma } from '@/lib/prisma';
import { updateStatusSchema, assignCourierSchema } from '@/lib/schemas';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        deliveryPoint: true,
        courier: {
          select: { id: true, name: true, email: true },
        },
        proof: true,
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(delivery);
  } catch (error) {
    console.error('Failed to fetch delivery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();

    // Check if it's a status update or assignment
    // Primitive but works for now. You might want separate endpoints or a unified schema.

    if (json.courierId) {
      const result = assignCourierSchema.safeParse({
        deliveryId: id,
        courierId: json.courierId,
      });
      if (!result.success)
        return NextResponse.json(
          { error: 'Invalid assignment data' },
          { status: 400 }
        );

      const updated = await prisma.delivery.update({
        where: { id },
        data: { courierId: result.data.courierId, status: 'ASSIGNED' },
      });
      return NextResponse.json(updated);
    }

    if (json.status) {
      const result = updateStatusSchema.safeParse({
        deliveryId: id,
        status: json.status,
      });
      if (!result.success)
        return NextResponse.json(
          { error: 'Invalid status data' },
          { status: 400 }
        );

      const updated = await prisma.delivery.update({
        where: { id },
        data: { status: result.data.status },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: 'No valid update data provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to update delivery:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery' },
      { status: 500 }
    );
  }
}
