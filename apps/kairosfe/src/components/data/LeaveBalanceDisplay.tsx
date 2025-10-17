import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store';
import { getUserBenefits } from '@/lib/api/services/leave-requests';
import type { UserBenefits } from '@kairos/shared';
import '@/lib/i18n';

export default function LeaveBalanceDisplay() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [benefits, setBenefits] = useState<UserBenefits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBenefits();
  }, [user]);

  const loadBenefits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserBenefits(user.id);
      setBenefits(data);
    } catch (error) {
      console.error('Failed to load leave benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 60) return 'bg-green-500 dark:bg-green-600';
    if (percentage > 30) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!benefits || benefits.benefits.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">
          {t('leaveRequest.noBenefitsAvailable')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {t('leaveRequest.leaveBalance')} - {benefits.year}
      </h2>

      <div className="space-y-4">
        {benefits.benefits.map((benefit) => {
          const percentage = (benefit.remainingDays / benefit.totalDays) * 100;
          const progressColor = getProgressColor(benefit.remainingDays, benefit.totalDays);

          return (
            <div
              key={benefit.type}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {benefit.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t(`leaveRequest.types.${benefit.type}`)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {benefit.remainingDays}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('leaveRequest.of')} {benefit.totalDays} {t('leaveRequest.days')}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${progressColor}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Used Days */}
              <div className="mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>
                  {t('leaveRequest.used')}: {benefit.usedDays} {t('leaveRequest.days')}
                </span>
                <span>{percentage.toFixed(0)}% {t('leaveRequest.remaining')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {benefits.benefits.reduce((sum, b) => sum + b.totalDays, 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('leaveRequest.totalDays')}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {benefits.benefits.reduce((sum, b) => sum + b.usedDays, 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('leaveRequest.usedDays')}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {benefits.benefits.reduce((sum, b) => sum + b.remainingDays, 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('leaveRequest.remainingDays')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
