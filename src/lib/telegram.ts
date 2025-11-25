import crypto from 'crypto';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface TelegramInitData {
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
}

export function parseTelegramInitData(initData: string): TelegramInitData | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) return null;

    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      if (key !== 'hash') {
        data[key] = value;
      }
    });

    const userStr = data.user;
    let user: TelegramUser | undefined;

    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        return null;
      }
    }

    return {
      user,
      auth_date: parseInt(data.auth_date || '0', 10),
      hash,
      query_id: data.query_id,
    };
  } catch {
    return null;
  }
}

export function validateTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) return false;

    // Create data check string (sorted alphabetically, excluding hash)
    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') {
        dataCheckArr.push(`${key}=${value}`);
      }
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Verify hash matches
    return calculatedHash === hash;
  } catch {
    return false;
  }
}

export function isTelegramInitDataExpired(authDate: number, maxAgeSeconds = 86400): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - authDate > maxAgeSeconds;
}
