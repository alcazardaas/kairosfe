import { useTranslation } from 'react-i18next';
import { getWeekStart, getWeekRangeString, addWeeks, isToday } from '@/lib/utils/date';
import '@/lib/i18n';

interface WeekPickerProps {
  selectedWeek: Date;
  onWeekChange: (weekStart: Date) => void;
}

export default function WeekPicker({ selectedWeek, onWeekChange }: WeekPickerProps) {
  const { t } = useTranslation();

  const handlePreviousWeek = () => {
    const newWeek = addWeeks(selectedWeek, -1);
    onWeekChange(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = addWeeks(selectedWeek, 1);
    onWeekChange(newWeek);
  };

  const handleThisWeek = () => {
    const thisWeek = getWeekStart();
    onWeekChange(thisWeek);
  };

  const isCurrentWeek = isToday(selectedWeek) ||
    (selectedWeek <= new Date() && addWeeks(selectedWeek, 1) > new Date());

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePreviousWeek}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Previous week"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      <div className="flex-1 text-center">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {getWeekRangeString(selectedWeek)}
        </div>
        {isCurrentWeek && (
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
            {t('timesheet.currentWeek')}
          </div>
        )}
      </div>

      <button
        onClick={handleNextWeek}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Next week"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>

      {!isCurrentWeek && (
        <button
          onClick={handleThisWeek}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {t('timesheet.thisWeek')}
        </button>
      )}
    </div>
  );
}
