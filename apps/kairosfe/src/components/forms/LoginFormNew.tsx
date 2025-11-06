import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api/client';
import { setAuthCookie } from '@/lib/auth/authCookie';

export default function LoginFormNew() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTokens = useAuthStore((state) => state.setTokens);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await apiClient.login(email, password);

      // The API returns { data: { token, refreshToken, user, tenant, ... } }
      const data = (response as any).data;

      // Save tokens to Zustand (persists to localStorage automatically)
      setTokens(data.token, data.refreshToken);

      // Set a simple auth cookie for SSR middleware (just the token)
      setAuthCookie(data.token);

      // Redirect to dashboard - AuthGuard will handle hydration
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Email Input */}
      <label className="flex flex-col">
        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium pb-2">Email</p>
        <input
          name="email"
          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800/20 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
          placeholder="you@example.com"
          type="email"
          required
          disabled={isLoading}
        />
      </label>

      {/* Password Input */}
      <label className="flex flex-col">
        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium pb-2">Password</p>
        <div className="relative flex w-full flex-1 items-stretch">
          <input
            name="password"
            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-800/20 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 pr-12 text-base font-normal leading-normal"
            placeholder="Enter your password"
            type={showPassword ? 'text' : 'password'}
            required
            disabled={isLoading}
          />
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-symbols-outlined h-5 w-5">
              {showPassword ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </label>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-x-2">
          <input
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-2 focus:ring-offset-0 focus:ring-primary focus:outline-none"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-normal">Remember me</p>
        </label>
        <a className="text-sm font-medium text-primary hover:underline" href="#">
          Forgot password?
        </a>
      </div>

      {/* Sign In Button */}
      <button
        className="w-full h-12 flex items-center justify-center rounded-lg bg-primary text-white text-base font-semibold transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
