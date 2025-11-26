export const CURRENCIES = [
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'KES', name: 'Kenyan Shilling' },
] as const;

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
] as const;

export const ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

export type Currency = typeof CURRENCIES[number]['code'];
export type Language = typeof LANGUAGES[number]['code'];
export type Role = typeof ROLES[keyof typeof ROLES];
