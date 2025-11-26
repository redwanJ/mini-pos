import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || '';

// POST - Generate a new staff invitation link
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, businessId } = JSON.parse(sessionCookie.value);
    if (!businessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    // Check if user is owner
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, name: true },
    });

    if (!business || business.ownerId !== userId) {
      return NextResponse.json({ error: 'Only owners can create invitations' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const role = body.role === 'MANAGER' ? 'MANAGER' : 'STAFF';
    const expiresInHours = body.expiresInHours || 24;

    // Create the invitation
    const invite = await prisma.staffInvite.create({
      data: {
        businessId,
        role,
        expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
      },
    });

    // Generate the bot link
    const inviteLink = BOT_USERNAME
      ? `https://t.me/${BOT_USERNAME}?start=invite_${invite.token}`
      : null;

    return NextResponse.json({
      token: invite.token,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      inviteLink,
      businessName: business.name,
    });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}

// GET - List active invitations
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, businessId } = JSON.parse(sessionCookie.value);
    if (!businessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 400 });
    }

    // Check if user is owner
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business || business.ownerId !== userId) {
      return NextResponse.json({ error: 'Only owners can view invitations' }, { status: 403 });
    }

    // Get active (unused, not expired) invitations
    const invites = await prisma.staffInvite.findMany({
      where: {
        businessId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      invites: invites.map((inv) => ({
        token: inv.token,
        role: inv.role,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        inviteLink: BOT_USERNAME
          ? `https://t.me/${BOT_USERNAME}?start=invite_${inv.token}`
          : null,
      })),
    });
  } catch (error) {
    console.error('List invites error:', error);
    return NextResponse.json({ error: 'Failed to list invitations' }, { status: 500 });
  }
}
