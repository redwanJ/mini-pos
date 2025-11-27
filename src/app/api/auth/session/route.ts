import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ session: null });
        }

        const sessionData = JSON.parse(sessionCookie.value);
        const { userId, businessId } = sessionData;

        // Fetch user name if not in session
        let name = '';
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true },
            });
            if (user) {
                name = `${user.firstName} ${user.lastName || ''}`.trim();
            }
        }

        return NextResponse.json({
            session: {
                ...sessionData,
                name,
            },
        });
    } catch (error) {
        console.error('Get session error:', error);
        return NextResponse.json({ session: null }, { status: 500 });
    }
}
