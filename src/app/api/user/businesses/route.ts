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

    const { userId, businessId: currentBusinessId } = JSON.parse(sessionCookie.value);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedBusiness: true,
        memberships: {
          include: { business: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const businesses: Array<{ id: string; name: string; role: string; isCurrent: boolean }> = [];

    if (user.ownedBusiness) {
      businesses.push({
        id: user.ownedBusiness.id,
        name: user.ownedBusiness.name,
        role: 'OWNER',
        isCurrent: user.ownedBusiness.id === currentBusinessId,
      });
    }

    for (const membership of user.memberships) {
      businesses.push({
        id: membership.business.id,
        name: membership.business.name,
        role: membership.role,
        isCurrent: membership.business.id === currentBusinessId,
      });
    }

    return NextResponse.json({ businesses, currentBusinessId });
  } catch (error) {
    console.error('Get businesses error:', error);
    return NextResponse.json({ error: 'Failed to get businesses' }, { status: 500 });
  }
}
