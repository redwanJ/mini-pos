import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// GET all staff members
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

    // Get all members (including owner)
    const members = await prisma.businessMember.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
      },
    });

    // Get pending requests
    const pendingRequests = await prisma.joinRequest.findMany({
      where: { businessId, status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
      },
    });

    const staff = members.map((m) => ({
      id: m.user.id,
      memberId: m.id,
      name: `${m.user.firstName} ${m.user.lastName || ''}`.trim(),
      username: m.user.username,
      photoUrl: m.user.photoUrl,
      role: m.role,
      permissions: {
        canAddProducts: m.canAddProducts,
        canEditProducts: m.canEditProducts,
        canDeleteProducts: m.canDeleteProducts,
        canViewReports: m.canViewReports,
        canManageStaff: m.canManageStaff,
      },
    }));

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { inviteCode: true },
    });

    return NextResponse.json({
      staff,
      pendingRequests: pendingRequests.map((r) => ({
        id: r.id,
        userId: r.user.id,
        name: `${r.user.firstName} ${r.user.lastName || ''}`.trim(),
        username: r.user.username,
        photoUrl: r.user.photoUrl,
        createdAt: r.createdAt.toISOString(),
      })),
      inviteCode: business?.inviteCode,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json({ error: 'Failed to get staff' }, { status: 500 });
  }
}
