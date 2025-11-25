import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = JSON.parse(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for pending join request
    const pendingRequest = await prisma.joinRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
    });

    if (pendingRequest) {
      return NextResponse.json({
        pendingRequest: {
          businessName: pendingRequest.business.name,
          createdAt: pendingRequest.createdAt,
        },
      });
    }

    return NextResponse.json({ pendingRequest: null });
  } catch (error) {
    console.error('Check pending request error:', error);
    return NextResponse.json(
      { error: 'Failed to check pending request' },
      { status: 500 }
    );
  }
}
