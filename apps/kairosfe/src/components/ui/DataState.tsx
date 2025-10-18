import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

type DataStateMode = 'loading' | 'empty' | 'error' | 'success';

interface DataStateProps {
  mode: DataStateMode;
  children?: ReactNode;
  error?: Error | string;
  emptyMessage?: string;
  emptyIcon?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  onRetry?: () => void;
  className?: string;
}

export default function DataState({
  mode,
  children,
  error,
  emptyMessage,
  emptyIcon = 'inbox',
  emptyAction,
  onRetry,
  className = '',
}: DataStateProps) {
  const { t } = useTranslation();

  // Success mode - render children
  if (mode === 'success') {
    return <>{children}</>;
  }

  // Loading mode - skeleton loader
  if (mode === 'loading') {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
        <div className="pt-4 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  // Empty mode
  if (mode === 'empty') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500 mb-4">
          {emptyIcon}
        </span>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
          {emptyMessage || t('dataState.noData')}
        </p>
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  // Error mode
  if (mode === 'error') {
    const errorMessage =
      typeof error === 'string' ? error : error?.message || t('dataState.errorGeneric');

    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <span className="material-symbols-outlined text-6xl text-red-500 dark:text-red-400 mb-4">
          error
        </span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('dataState.errorTitle')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
          {errorMessage}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
            {t('dataState.retry')}
          </button>
        )}
      </div>
    );
  }

  return null;
}
