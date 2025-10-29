/**
 * TimesheetContentNew Component
 * Main timesheet interface with tabbed navigation
 * Combines My Week, History, and Reports views
 */

import { useTranslation } from 'react-i18next';
import { useTimesheetStore } from '@/lib/store';
import TimesheetWeekTab from './TimesheetWeekTab';
import TimesheetHistoryTab from './TimesheetHistoryTab';
import TimesheetReportsTab from './TimesheetReportsTab';
import AuthGuard from '@/components/auth/AuthGuard';
import '@/lib/i18n';

type TabType = 'week' | 'history' | 'reports';

export default function TimesheetContentNew() {
  const { t } = useTranslation();
  const activeTabStore = useTimesheetStore((state) => state.activeTab);
  const setActiveTab = useTimesheetStore((state) => state.setActiveTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const tabs = [
    {
      id: 'week' as const,
      label: t('timesheet.tabs.myWeek'),
      icon: 'calendar_view_week',
    },
    {
      id: 'history' as const,
      label: t('timesheet.tabs.history'),
      icon: 'history',
    },
    {
      id: 'reports' as const,
      label: t('timesheet.tabs.reports'),
      icon: 'bar_chart',
    },
  ];

  return (
    <AuthGuard>
      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('timesheet.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('timesheet.description')}
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                {tabs.map((tab) => {
                  const isActive = activeTabStore === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`
                        flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors
                        border-b-3
                        ${
                          isActive
                            ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTabStore === 'week' && <TimesheetWeekTab />}
              {activeTabStore === 'history' && <TimesheetHistoryTab />}
              {activeTabStore === 'reports' && <TimesheetReportsTab />}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
