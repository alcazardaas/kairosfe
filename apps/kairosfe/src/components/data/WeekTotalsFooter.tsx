/**
 * WeekTotalsFooter Component
 * Displays daily and weekly hour totals at the bottom of the timesheet grid
 * Epic 1, Story 2: View daily and weekly totals
 */

import { useTranslation } from 'react-i18next';

interface WeekTotalsFooterProps {
  dailyTotals: number[]; // Array of 7 numbers (one per day, Sun-Sat)
  weeklyTotal: number;
  targetHours?: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekTotalsFooter({
  dailyTotals,
  weeklyTotal,
  targetHours = 40,
}: WeekTotalsFooterProps) {
  const { t } = useTranslation();

  // Ensure we have exactly 7 days, filling with 0s if needed
  const normalizedTotals = Array.from({ length: 7 }, (_, i) => dailyTotals[i] ?? 0);

  // Check if weekly total meets or exceeds target
  const meetsTarget = weeklyTotal >= targetHours;
  const percentageOfTarget = targetHours > 0 ? (weeklyTotal / targetHours) * 100 : 0;

  return (
    <div className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
      {/* Daily Totals Row */}
      <div className="grid grid-cols-8 gap-2 p-4">
        <div className="font-semibold text-gray-900 dark:text-gray-100">
          {t('timesheet.totals.daily')}
        </div>
        {DAYS.map((day, index) => {
          const total = normalizedTotals[index];
          return (
            <div
              key={index}
              className="text-center font-medium text-gray-900 dark:text-gray-100"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{day}</div>
              <div className="text-lg">{total.toFixed(1)}h</div>
            </div>
          );
        })}
      </div>

      {/* Weekly Total Row */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('timesheet.totals.weekly')}
            </span>
            <span
              className={`text-2xl font-bold ${
                meetsTarget
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}
            >
              {weeklyTotal.toFixed(1)}h
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              / {targetHours}h {t('timesheet.totals.target')}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-3">
            <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  meetsTarget
                    ? 'bg-green-500 dark:bg-green-400'
                    : 'bg-yellow-500 dark:bg-yellow-400'
                }`}
                style={{ width: `${Math.min(percentageOfTarget, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
              {percentageOfTarget.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
