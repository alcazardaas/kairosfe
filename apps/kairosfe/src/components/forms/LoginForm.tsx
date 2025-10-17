import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api/client';
import { trackLogin } from '@/lib/analytics/posthog';
import { FormInput } from './FormInput';
import '@/lib/i18n';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');

      // Call login endpoint
      const response = await apiClient.login(data.email, data.password);

      // Save tokens and user to store
      login(response.user, response.token, response.refreshToken);

      // Hydrate user session (fetch /me)
      await useAuthStore.getState().hydrate();

      // Track successful login
      trackLogin(true);

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.loginError');
      setError(errorMessage);
      trackLogin(false);

      // Log error to Sentry
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(err, {
          tags: { type: 'login_failure' },
          user: { email: data.email },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form">
      <FormInput
        label={t('auth.email')}
        name="email"
        type="email"
        register={register}
        error={errors.email}
        placeholder="demo@kairos.com"
      />

      <FormInput
        label={t('auth.password')}
        name="password"
        type="password"
        register={register}
        error={errors.password}
        placeholder="demo123"
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
        {loading ? t('common.loading') : t('auth.loginButton')}
      </button>

      <p className="login-hint">
        Try: demo@kairos.com / demo123
      </p>
    </form>
  );
}
