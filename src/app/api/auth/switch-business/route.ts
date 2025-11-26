import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = JSON.parse(sessionCookie.value);
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    // Verify user has access to this business
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

    // Check if user owns or is a member of this business
    let role: string | null = null;

    if (user.ownedBusiness?.id === businessId) {
      role = 'OWNER';
    } else {
      const membership = user.memberships.find(m => m.businessId === businessId);
      if (membership) {
        role = membership.role;
      }
    }

    if (!role) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update session cookie with new business
    cookieStore.set('session', JSON.stringify({
      userId,
      businessId,
      role,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, businessId, role });
  } catch (error) {
    console.error('Switch business error:', error);
    return NextResponse.json({ error: 'Failed to switch business' }, { status: 500 });
  }
}
