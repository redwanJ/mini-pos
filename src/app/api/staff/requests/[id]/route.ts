import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// PUT approve/reject request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId, role } = JSON.parse(sessionCookie.value);
    if (!businessId || role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const joinRequest = await prisma.joinRequest.findFirst({
      where: { id, businessId },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Create membership
      await prisma.businessMember.create({
        data: {
          userId: joinRequest.userId,
          businessId,
          role: 'STAFF',
          canAddProducts: false,
          canEditProducts: false,
          canDeleteProducts: false,
          canViewReports: false,
          canManageStaff: false,
        },
      });

      // Update request status
      await prisma.joinRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });
    } else {
      // Reject request
      await prisma.joinRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Handle request error:', error);
    return NextResponse.json({ error: 'Failed to handle request' }, { status: 500 });
  }
}
