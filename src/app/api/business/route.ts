import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// GET current business
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = JSON.parse(sessionCookie.value);
    if (!businessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency,
        taxRate: business.taxRate,
        receiptMessage: business.receiptMessage,
        inviteCode: business.inviteCode,
        ownerName: `${business.owner.firstName} ${business.owner.lastName || ''}`.trim(),
      },
    });
  } catch (error) {
    console.error('Get business error:', error);
    return NextResponse.json({ error: 'Failed to get business' }, { status: 500 });
  }
}

// PUT update business
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, businessId, role } = JSON.parse(sessionCookie.value);
    if (!businessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    // Only owner can update business settings
    if (role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, currency, taxRate, receiptMessage } = body;

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...(name && { name }),
        ...(currency && { currency }),
        ...(taxRate !== undefined && { taxRate: parseFloat(taxRate) }),
        ...(receiptMessage !== undefined && { receiptMessage }),
      },
    });

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency,
        taxRate: business.taxRate,
        receiptMessage: business.receiptMessage,
      },
    });
  } catch (error) {
    console.error('Update business error:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}
