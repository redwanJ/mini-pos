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
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already owns a business
    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: userId },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'You already own a business' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, currency = 'ETB' } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Create the business
    const business = await prisma.business.create({
      data: {
        name: name.trim(),
        currency,
        ownerId: userId,
      },
    });

    // Update session cookie with business ID
    cookieStore.set('session', JSON.stringify({
      userId,
      businessId: business.id,
      role: 'OWNER',
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency,
        inviteCode: business.inviteCode,
      },
    });
  } catch (error) {
    console.error('Create business error:', error);
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    );
  }
}
