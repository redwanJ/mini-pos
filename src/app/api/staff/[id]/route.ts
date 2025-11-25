import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// PUT update staff permissions
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
    const { role: newRole, permissions } = body;

    const member = await prisma.businessMember.findFirst({
      where: { id, businessId },
    });

    if (!member) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const updated = await prisma.businessMember.update({
      where: { id },
      data: {
        ...(newRole && { role: newRole }),
        ...(permissions && {
          canAddProducts: permissions.canAddProducts,
          canEditProducts: permissions.canEditProducts,
          canDeleteProducts: permissions.canDeleteProducts,
          canViewReports: permissions.canViewReports,
          canManageStaff: permissions.canManageStaff,
        }),
      },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

// DELETE remove staff
export async function DELETE(
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

    const member = await prisma.businessMember.findFirst({
      where: { id, businessId },
    });

    if (!member) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    await prisma.businessMember.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
