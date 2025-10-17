import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCalendarData } from '@/lib/api/services/calendar';
import type { CalendarEvent } from '@kairos/shared';
import '@/lib/i18n';

interface CalendarProps {
  userId?: string;
  onDateClick?: (date: Date) => void;
}

export default function Calendar({ userId = 'me', onDateClick }: CalendarProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, userId]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);

      // Get first and last day of the month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const data = await getCalendarData({
        userId,
        from: firstDay.toISOString().split('T')[0],
        to: lastDay.toISOString().split('T')[0],
        include: ['holidays', 'leave'],
      });

      setEvents(data.events);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(year, month, 1).getDay();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (day: number): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((event) => event.date === dateStr);
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    if (onDateClick) {
      onDateClick(new Date(year, month, day));
    }
  };

  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Generate calendar days (including padding days from previous/next month)
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {monthName}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
              chevron_left
            </span>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {t('calendar.today')}
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next month"
          >
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayEvents = getEventsForDate(day);
            const hasHoliday = dayEvents.some((e) => e.type === 'holiday');
            const hasLeave = dayEvents.some((e) => e.type === 'leave');
            const today = isToday(day);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square p-1 rounded-lg text-sm relative
                  transition-colors
                  ${
                    today
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${dayEvents.length > 0 ? 'font-medium' : ''}
                `}
                title={dayEvents.map((e) => e.title).join(', ')}
              >
                <div className="flex flex-col items-center">
                  <span>{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasHoliday && (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                      )}
                      {hasLeave && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" />
            <span className="text-gray-600 dark:text-gray-400">{t('calendar.holidays')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" />
            <span className="text-gray-600 dark:text-gray-400">{t('calendar.approvedLeave')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
