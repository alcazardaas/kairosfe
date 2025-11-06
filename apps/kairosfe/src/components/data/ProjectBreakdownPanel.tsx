/**
 * ProjectBreakdownPanel Component
 * Displays a breakdown of hours logged per project for the current week
 * Epic 1, Story 3: View project breakdown
 */

import { useTranslation } from 'react-i18next';
import type { ProjectBreakdownDto } from '../../lib/api/schemas';

interface ProjectBreakdownPanelProps {
  breakdown: ProjectBreakdownDto[];
  totalHours: number;
  className?: string;
}

export default function ProjectBreakdownPanel({
  breakdown,
  totalHours = 0,
  className = '',
}: ProjectBreakdownPanelProps) {
  const { t } = useTranslation();

  // Sort by hours descending (with defensive check for null/undefined)
  const sortedBreakdown = (breakdown || []).sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('timesheet.breakdown.title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('timesheet.breakdown.subtitle')}
        </p>
      </div>

      <div className="p-4">
        {sortedBreakdown.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">{t('timesheet.breakdown.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBreakdown.map((project) => {
              const percentage = totalHours > 0 ? (project.totalHours / totalHours) * 100 : 0;

              return (
                <div key={project.projectId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                      {project.projectName}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {project.totalHours.toFixed(1)}h
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3rem] text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total Summary */}
        {sortedBreakdown.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('timesheet.breakdown.total')}
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {totalHours.toFixed(1)}h
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('timesheet.breakdown.projectCount', { count: sortedBreakdown.length })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
