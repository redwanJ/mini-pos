import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { locale } = await request.json();

    if (!['en', 'am'].includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    const cookieStore = await cookies();

    // Update cookie
    cookieStore.set('locale', locale, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    // Update user preference if logged in
    const sessionCookie = cookieStore.get('session');
    if (sessionCookie?.value) {
      try {
        const { userId } = JSON.parse(sessionCookie.value);
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { languageCode: locale },
          });
        }
      } catch {
        // Ignore session parsing errors
      }
    }

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    console.error('Locale update error:', error);
    return NextResponse.json({ error: 'Failed to update locale' }, { status: 500 });
  }
}
