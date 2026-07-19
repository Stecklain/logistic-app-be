export const USER_ROLES = ['admin', 'logistica'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const MAX_FAILED_LOGIN_ATTEMPTS = 3;
export const LOGIN_LOCKOUT_MINUTES = 10;
