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

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode?.trim()) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Find business by invite code
    const business = await prisma.business.findUnique({
      where: { inviteCode: inviteCode.trim() },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId: business.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this business' },
        { status: 400 }
      );
    }

    // Check if user is the owner
    if (business.ownerId === userId) {
      return NextResponse.json(
        { error: 'You own this business' },
        { status: 400 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId: business.id,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json({
          status: 'pending',
          businessName: business.name,
          message: 'You already have a pending request',
        });
      } else if (existingRequest.status === 'REJECTED') {
        // Update the rejected request to pending
        await prisma.joinRequest.update({
          where: { id: existingRequest.id },
          data: { status: 'PENDING', updatedAt: new Date() },
        });

        return NextResponse.json({
          status: 'pending',
          businessName: business.name,
        });
      }
    }

    // Create join request
    await prisma.joinRequest.create({
      data: {
        userId,
        businessId: business.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      status: 'pending',
      businessName: business.name,
    });
  } catch (error) {
    console.error('Join business error:', error);
    return NextResponse.json(
      { error: 'Failed to join business' },
      { status: 500 }
    );
  }
}
