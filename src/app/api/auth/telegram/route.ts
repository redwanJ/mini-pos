import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { parseTelegramInitData, validateTelegramInitData, isTelegramInitDataExpired } from '@/lib/telegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData, mockUser } = body;

    let telegramUser: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    } | null = null;

    // In development, allow mock user
    if (process.env.NODE_ENV === 'development' && mockUser) {
      telegramUser = mockUser;
    } else if (initData) {
      // Validate the init data in production
      if (BOT_TOKEN && process.env.NODE_ENV === 'production') {
        if (!validateTelegramInitData(initData, BOT_TOKEN)) {
          return NextResponse.json({ error: 'Invalid init data' }, { status: 401 });
        }
      }

      const parsed = parseTelegramInitData(initData);
      if (!parsed?.user) {
        return NextResponse.json({ error: 'No user data' }, { status: 401 });
      }

      // Check if expired (24 hours)
      if (isTelegramInitDataExpired(parsed.auth_date)) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }

      telegramUser = parsed.user;
    }

    if (!telegramUser) {
      return NextResponse.json({ error: 'No user data provided' }, { status: 401 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUser.id) },
      include: {
        ownedBusiness: true,
        memberships: {
          where: { business: { isNot: null } },
          include: { business: true },
        },
        joinRequests: {
          where: { status: 'PENDING' },
          include: { business: true },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(telegramUser.id),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
          languageCode: telegramUser.language_code || 'en',
        },
        include: {
          ownedBusiness: true,
          memberships: {
            include: { business: true },
          },
          joinRequests: {
            where: { status: 'PENDING' },
            include: { business: true },
          },
        },
      });
    } else {
      // Update user info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
        },
        include: {
          ownedBusiness: true,
          memberships: {
            include: { business: true },
          },
          joinRequests: {
            where: { status: 'PENDING' },
            include: { business: true },
          },
        },
      });
    }

    // Determine business context
    let businessId: string | null = null;
    let role: string | null = null;
    let needsOnboarding = false;

    if (user.ownedBusiness) {
      businessId = user.ownedBusiness.id;
      role = 'OWNER';
    } else if (user.memberships.length > 0) {
      businessId = user.memberships[0].businessId;
      role = user.memberships[0].role;
    } else {
      // User needs to create or join a business
      needsOnboarding = true;
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', JSON.stringify({
      userId: user.id,
      businessId,
      role,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set locale cookie based on user preference
    cookieStore.set('locale', user.languageCode === 'am' ? 'am' : 'en', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return NextResponse.json({
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        languageCode: user.languageCode,
      },
      businessId,
      role,
      needsOnboarding,
      pendingRequest: user.joinRequests.length > 0 ? {
        businessName: user.joinRequests[0].business.name,
        status: user.joinRequests[0].status,
      } : null,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
