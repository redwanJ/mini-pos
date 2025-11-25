import { cookies } from 'next/headers';
import prisma from './db';
import { parseTelegramInitData, validateTelegramInitData, isTelegramInitDataExpired } from './telegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export interface AuthUser {
  id: string;
  telegramId: bigint;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  languageCode: string;
}

export interface AuthSession {
  user: AuthUser;
  businessId: string | null;
  role: 'OWNER' | 'MANAGER' | 'STAFF' | null;
  permissions: {
    canAddProducts: boolean;
    canEditProducts: boolean;
    canDeleteProducts: boolean;
    canViewReports: boolean;
    canManageStaff: boolean;
  } | null;
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const { userId, businessId } = JSON.parse(sessionCookie.value);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedBusiness: true,
        memberships: {
          where: businessId ? { businessId } : undefined,
          include: { business: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    let role: 'OWNER' | 'MANAGER' | 'STAFF' | null = null;
    let permissions = null;
    let resolvedBusinessId = businessId;

    // Check if user owns a business
    if (user.ownedBusiness) {
      role = 'OWNER';
      resolvedBusinessId = user.ownedBusiness.id;
      permissions = {
        canAddProducts: true,
        canEditProducts: true,
        canDeleteProducts: true,
        canViewReports: true,
        canManageStaff: true,
      };
    } else if (user.memberships.length > 0) {
      const membership = user.memberships[0];
      role = membership.role;
      resolvedBusinessId = membership.businessId;
      permissions = {
        canAddProducts: membership.canAddProducts,
        canEditProducts: membership.canEditProducts,
        canDeleteProducts: membership.canDeleteProducts,
        canViewReports: membership.canViewReports,
        canManageStaff: membership.canManageStaff,
      };
    }

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        languageCode: user.languageCode,
      },
      businessId: resolvedBusinessId,
      role,
      permissions,
    };
  } catch {
    return null;
  }
}

export async function authenticateWithTelegram(initData: string): Promise<AuthSession | null> {
  // Validate the init data
  if (BOT_TOKEN && !validateTelegramInitData(initData, BOT_TOKEN)) {
    // In development, we might skip validation
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
  }

  const parsed = parseTelegramInitData(initData);
  if (!parsed?.user) {
    return null;
  }

  // Check if expired (24 hours)
  if (isTelegramInitDataExpired(parsed.auth_date)) {
    return null;
  }

  const telegramUser = parsed.user;

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramUser.id) },
    include: {
      ownedBusiness: true,
      memberships: {
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
      },
    });
  }

  let role: 'OWNER' | 'MANAGER' | 'STAFF' | null = null;
  let permissions = null;
  let businessId: string | null = null;

  if (user.ownedBusiness) {
    role = 'OWNER';
    businessId = user.ownedBusiness.id;
    permissions = {
      canAddProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canViewReports: true,
      canManageStaff: true,
    };
  } else if (user.memberships.length > 0) {
    const membership = user.memberships[0];
    role = membership.role;
    businessId = membership.businessId;
    permissions = {
      canAddProducts: membership.canAddProducts,
      canEditProducts: membership.canEditProducts,
      canDeleteProducts: membership.canDeleteProducts,
      canViewReports: membership.canViewReports,
      canManageStaff: membership.canManageStaff,
    };
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify({ userId: user.id, businessId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return {
    user: {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      photoUrl: user.photoUrl,
      languageCode: user.languageCode,
    },
    businessId,
    role,
    permissions,
  };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
