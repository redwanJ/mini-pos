import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET - Validate an invitation token (can be called by bot or user)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invite = await prisma.staffInvite.findUnique({
      where: { token },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Invitation already used' }, { status: 410 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      role: invite.role,
      businessName: invite.business.name,
      businessId: invite.business.id,
      ownerName: `${invite.business.owner.firstName} ${invite.business.owner.lastName || ''}`.trim(),
      expiresAt: invite.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Validate invite error:', error);
    return NextResponse.json({ error: 'Failed to validate invitation' }, { status: 500 });
  }
}

// POST - Accept an invitation (requires authenticated user)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = JSON.parse(sessionCookie.value);

    // Validate the invitation
    const invite = await prisma.staffInvite.findUnique({
      where: { token },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'Invitation already used' }, { status: 410 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
    }

    // Check if user is the owner (can't join own business)
    if (invite.business.ownerId === userId) {
      return NextResponse.json({ error: 'You own this business' }, { status: 400 });
    }

    // Check if already a member
    const existingMembership = await prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId: invite.businessId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this business' }, { status: 400 });
    }

    // Create the membership and mark invite as used
    const [membership] = await prisma.$transaction([
      prisma.businessMember.create({
        data: {
          userId,
          businessId: invite.businessId,
          role: invite.role,
          canAddProducts: true,
          canEditProducts: invite.role === 'MANAGER',
          canDeleteProducts: false,
          canViewReports: invite.role === 'MANAGER',
          canManageStaff: false,
        },
      }),
      prisma.staffInvite.update({
        where: { id: invite.id },
        data: {
          usedAt: new Date(),
          usedById: userId,
        },
      }),
      // Delete any pending join requests for this user/business
      prisma.joinRequest.deleteMany({
        where: {
          userId,
          businessId: invite.businessId,
        },
      }),
    ]);

    // Update session cookie with new business
    cookieStore.set(
      'session',
      JSON.stringify({ userId, businessId: invite.businessId }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );

    return NextResponse.json({
      success: true,
      businessId: invite.businessId,
      businessName: invite.business.name,
      role: membership.role,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}

// DELETE - Revoke an invitation (owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, businessId } = JSON.parse(sessionCookie.value);

    // Check if user is owner
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business || business.ownerId !== userId) {
      return NextResponse.json({ error: 'Only owners can revoke invitations' }, { status: 403 });
    }

    // Delete the invitation
    await prisma.staffInvite.delete({
      where: { token, businessId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke invite error:', error);
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}
