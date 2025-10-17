// Shared constants for Kairos

export const APP_NAME = 'Kairos';
export const APP_DESCRIPTION = 'HR Management System';

export const AUTH_TOKEN_KEY = 'kairos_auth_token';
export const THEME_KEY = 'kairos_theme';

export const SUPPORTED_LOCALES = ['en', 'es', 'pt-PT', 'de'] as const;
export const DEFAULT_LOCALE = 'en';

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  USERS: '/users',
  LEAVE_REQUESTS: '/leave-requests',
  TEAM: '/team',
} as const;
