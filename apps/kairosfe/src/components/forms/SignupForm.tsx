import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api/client';
import { setAuthCookie } from '@/lib/auth/authCookie';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

// Validation schema matching API requirements
const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name is too long')
      .transform((val) => val.trim()),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name is too long')
      .transform((val) => val.trim()),
    companyName: z
      .string()
      .min(1, 'Company name is required')
      .max(200, 'Company name is too long')
      .transform((val) => val.trim()),
    timezone: z.string().optional(),
    acceptedTerms: z
      .boolean()
      .refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

// Rate limit tracking
const RATE_LIMIT_KEY = 'kairos_signup_attempts';
const RATE_LIMIT_MAX = 4;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function getSignupAttempts(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as number[];
  } catch {
    return [];
  }
}

function addSignupAttempt(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const attempts = getSignupAttempts();

  // Remove attempts older than 1 hour
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);
  recentAttempts.push(now);

  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentAttempts));
}

function getRemainingAttempts(): number {
  const now = Date.now();
  const attempts = getSignupAttempts();
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);
  return Math.max(0, RATE_LIMIT_MAX - recentAttempts.length);
}

function getTimeUntilReset(): number {
  const attempts = getSignupAttempts();
  if (attempts.length === 0) return 0;

  const now = Date.now();
  const oldestAttempt = Math.min(...attempts);
  const resetTime = oldestAttempt + RATE_LIMIT_WINDOW;

  return Math.max(0, resetTime - now);
}

export default function SignupForm() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const setTokens = useAuthStore((state) => state.setTokens);

  // Auto-detect timezone
  const defaultTimezone = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      timezone: defaultTimezone,
      acceptedTerms: false,
    },
  });

  // Check rate limit on component mount
  React.useEffect(() => {
    const remaining = getRemainingAttempts();
    if (remaining === 0) {
      const timeUntilReset = getTimeUntilReset();
      const minutesUntilReset = Math.ceil(timeUntilReset / 1000 / 60);
      setRateLimitError(
        t('auth.rateLimitExceeded') ||
        `Too many signup attempts. Please try again in ${minutesUntilReset} minutes.`
      );
    }
  }, [t]);

  const onSubmit = async (data: SignupFormData) => {
    // Check rate limit before submission
    const remaining = getRemainingAttempts();
    if (remaining === 0) {
      const timeUntilReset = getTimeUntilReset();
      const minutesUntilReset = Math.ceil(timeUntilReset / 1000 / 60);
      setRateLimitError(
        t('auth.rateLimitExceeded') ||
        `Too many signup attempts. Please try again in ${minutesUntilReset} minutes.`
      );
      return;
    }

    setError(null);
    setRateLimitError(null);
    setIsLoading(true);

    try {
      // Track signup attempt (PostHog)
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('signup_initiated', {
          hasCompany: !!data.companyName,
          timezone: data.timezone || defaultTimezone,
        });
      }

      const response = await apiClient.signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        timezone: data.timezone || defaultTimezone,
        acceptedTerms: data.acceptedTerms,
      });

      // Track successful signup
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('signup_success', {
          userId: response.data.user.id,
          tenantId: response.data.tenant.id,
          tenantSlug: response.data.tenant.slug,
          timezone: data.timezone || defaultTimezone,
        });
      }

      // Save tokens to Zustand store
      setTokens(response.data.token, response.data.refreshToken);

      // Set auth cookie for SSR middleware
      setAuthCookie(response.data.token);

      // Track rate limit attempt (for client-side hint only)
      addSignupAttempt();

      // Redirect to dashboard - AuthGuard will handle hydration
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Signup failed:', err);

      // Track failed signup
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('signup_failure', {
          reason: err.statusCode === 409 ? 'conflict' : err.statusCode === 429 ? 'rate_limit' : 'error',
          statusCode: err.statusCode,
        });
      }

      // Handle specific error codes
      if (err.statusCode === 409) {
        setError(t('auth.emailTaken') || 'This email is already registered. Try logging in instead.');
      } else if (err.statusCode === 429) {
        addSignupAttempt(); // Track the attempt
        const timeUntilReset = getTimeUntilReset();
        const minutesUntilReset = Math.ceil(timeUntilReset / 1000 / 60);
        setRateLimitError(
          t('auth.rateLimitExceeded') ||
          `Too many signup attempts. Please try again in ${minutesUntilReset} minutes.`
        );
      } else if (err.statusCode === 400) {
        setError(err.message || 'Please check your input and try again.');
      } else {
        setError(
          err.message ||
          t('auth.signupError') ||
          'Signup failed. Please try again later.'
        );
      }

      // Send error to Sentry (non-4xx errors)
      if (typeof window !== 'undefined' && (window as any).Sentry && err.statusCode >= 500) {
        (window as any).Sentry.captureException(err, {
          tags: { type: 'signup_failure' },
          user: { email: data.email },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const remainingAttempts = getRemainingAttempts();
  const isRateLimited = remainingAttempts === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {rateLimitError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{rateLimitError}</p>
        </div>
      )}

      {/* Rate limit warning (before hitting limit) */}
      {!isRateLimited && remainingAttempts <= 2 && remainingAttempts > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {remainingAttempts === 1
              ? 'You have 1 signup attempt remaining this hour.'
              : `You have ${remainingAttempts} signup attempts remaining this hour.`}
          </p>
        </div>
      )}

      {/* First Name */}
      <label className="flex flex-col">
        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium pb-2">
          {t('auth.firstName') || 'First Name'} <span className="text-red-500">*</span>
        </p>
        <input
          {...register('firstName')}
          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800/20 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
          placeholder="John"
          type="text"
          disabled={isLoading || isRateLimited}
        />
        {errors.firstName && (
          <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
        )}
      </label>

      {/* Last Name */}
      <label className="flex flex-col">
        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium pb-2">
          {t('auth.lastName') || 'Last Name'} <span className="text-red-500">*</span>
        </p>
        <input
          {...register('lastName')}
          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800/20 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
          placeholder="Doe"
          type="text"
          disabled={isLoading || isRateLimited}
        />
        {errors.lastName && (
          <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
        )}
      </label>

      {/* Company Name */}
      <label className="flex flex-col">
        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium pb-2">
          {t('auth.companyName') || 'Company Name'} <span className="text-red-500">*</span>
        </p>
        <input
          {...register('companyName')}
          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800/20 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
          placeholder="Acme Corporation"
          type="text"
          disabled={isLoading || isRateLimited}
        />
        {errors.companyName && (
          <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
        )}
      </label>

      {/* Email */}
      <label className="flex flex-col">
        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium pb-2">
          {t('auth.email') || 'Email'} <span className="text-red-500">*</span>
        </p>
        <input
          {...register('email')}
          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800/20 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
          placeholder="you@example.com"
          type="email"
          disabled={isLoading || isRateLimited}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </label>

      {/* Password */}
      <label className="flex flex-col">
        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium pb-2">
          {t('auth.password') || 'Password'} <span className="text-red-500">*</span>
        </p>
        <div className="relative flex w-full flex-1 items-stretch">
          <input
            {...register('password')}
            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800/20 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 pr-12 text-base font-normal leading-normal"
            placeholder="At least 8 characters"
            type={showPassword ? 'text' : 'password'}
            disabled={isLoading || isRateLimited}
          />
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading || isRateLimited}
          >
            <span className="material-symbols-outlined h-5 w-5">
              {showPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
          Minimum 8 characters required
        </p>
      </label>

      {/* Confirm Password */}
      <label className="flex flex-col">
        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium pb-2">
          {t('auth.confirmPassword') || 'Confirm Password'} <span className="text-red-500">*</span>
        </p>
        <div className="relative flex w-full flex-1 items-stretch">
          <input
            {...register('confirmPassword')}
            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800/20 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 pr-12 text-base font-normal leading-normal"
            placeholder="Re-enter your password"
            type={showConfirmPassword ? 'text' : 'password'}
            disabled={isLoading || isRateLimited}
          />
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading || isRateLimited}
          >
            <span className="material-symbols-outlined h-5 w-5">
              {showConfirmPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
        )}
      </label>

      {/* Timezone (hidden, auto-detected) */}
      <input type="hidden" {...register('timezone')} />

      {/* Terms and Conditions */}
      <label className="flex items-start gap-x-3">
        <input
          {...register('acceptedTerms')}
          className="h-4 w-4 mt-1 rounded border-gray-300 dark:border-gray-600 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-2 focus:ring-offset-0 focus:ring-primary focus:outline-none"
          type="checkbox"
          disabled={isLoading || isRateLimited}
        />
        <p className="text-gray-700 dark:text-gray-300 text-sm">
          {t('auth.acceptTerms') || 'I accept the'}{' '}
          <a href="#" className="text-primary hover:underline">
            Terms and Conditions
          </a>{' '}
          <span className="text-red-500">*</span>
        </p>
      </label>
      {errors.acceptedTerms && (
        <p className="text-red-500 text-sm -mt-3">{errors.acceptedTerms.message}</p>
      )}

      {/* Submit Button */}
      <button
        className="w-full h-12 flex items-center justify-center rounded-lg bg-primary text-white text-base font-semibold transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={isLoading || isRateLimited}
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
            {t('common.loading') || 'Creating account...'}
          </>
        ) : (
          t('auth.signupButton') || 'Create Account'
        )}
      </button>
    </form>
  );
}
