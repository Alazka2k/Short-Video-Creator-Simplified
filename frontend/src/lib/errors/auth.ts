"use client";

import loginErrors from '@/data/errors/login.json';

type Language = 'en' | 'de';
type ErrorType = 'login' | 'signup' | 'google' | 'reset';

type LoginErrorKeys = 'INVALID_CREDENTIALS' | 'USER_NOT_FOUND' | 'ACCOUNT_LOCKED' | 'RATE_LIMIT_EXCEEDED' | 'DEFAULT';
type SignupErrorKeys = 'EMAIL_EXISTS' | 'INVALID_PASSWORD' | 'INVALID_EMAIL' | 'TERMS_REQUIRED' | 'REGISTRATION_DISABLED' | 'DEFAULT';
type GoogleErrorKeys = 'EMAIL_EXISTS' | 'INVALID_TOKEN' | 'PROVIDER_DISABLED' | 'LOGIN_INTERRUPTED' | 'PERMISSION_REQUIRED' | 'DEFAULT';
type ResetErrorKeys = 'EMAIL_SENT' | 'EMAIL_NOT_FOUND' | 'RESET_EXPIRED' | 'RESET_INVALID' | 'PASSWORD_MISMATCH' | 'DEFAULT';
type ErrorKey = LoginErrorKeys | SignupErrorKeys | GoogleErrorKeys | ResetErrorKeys;

export const AuthErrorKeys = {
  login: {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS' as LoginErrorKeys,
    USER_NOT_FOUND: 'USER_NOT_FOUND' as LoginErrorKeys,
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED' as LoginErrorKeys,
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED' as LoginErrorKeys,
    DEFAULT: 'DEFAULT' as LoginErrorKeys
  },
  signup: {
    EMAIL_EXISTS: 'EMAIL_EXISTS' as SignupErrorKeys,
    INVALID_PASSWORD: 'INVALID_PASSWORD' as SignupErrorKeys,
    INVALID_EMAIL: 'INVALID_EMAIL' as SignupErrorKeys,
    TERMS_REQUIRED: 'TERMS_REQUIRED' as SignupErrorKeys,
    REGISTRATION_DISABLED: 'REGISTRATION_DISABLED' as SignupErrorKeys,
    DEFAULT: 'DEFAULT' as SignupErrorKeys
  },
  google: {
    EMAIL_EXISTS: 'EMAIL_EXISTS' as GoogleErrorKeys,
    INVALID_TOKEN: 'INVALID_TOKEN' as GoogleErrorKeys,
    PROVIDER_DISABLED: 'PROVIDER_DISABLED' as GoogleErrorKeys,
    LOGIN_INTERRUPTED: 'LOGIN_INTERRUPTED' as GoogleErrorKeys,
    PERMISSION_REQUIRED: 'PERMISSION_REQUIRED' as GoogleErrorKeys,
    DEFAULT: 'DEFAULT' as GoogleErrorKeys
  },
  reset: {
    EMAIL_SENT: 'EMAIL_SENT' as ResetErrorKeys,
    EMAIL_NOT_FOUND: 'EMAIL_NOT_FOUND' as ResetErrorKeys,
    RESET_EXPIRED: 'RESET_EXPIRED' as ResetErrorKeys,
    RESET_INVALID: 'RESET_INVALID' as ResetErrorKeys,
    PASSWORD_MISMATCH: 'PASSWORD_MISMATCH' as ResetErrorKeys,
    DEFAULT: 'DEFAULT' as ResetErrorKeys
  }
};

export function getAuthError(
  key: ErrorKey,
  type: ErrorType = 'login',
  lang: Language = 'en'
): string {
  try {
    return (loginErrors as any)[lang].auth[type][key] || 
           (loginErrors as any)[lang].auth[type].DEFAULT;
  } catch (error) {
    return (loginErrors as any).en.auth[type].DEFAULT;
  }
} 