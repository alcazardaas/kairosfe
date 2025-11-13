/**
 * Comprehensive tests for Date Utilities
 * Target: 95%+ coverage
 */

import { describe, it, expect } from 'vitest';
import {
  getWeekStart,
  getWeekEnd,
  formatDate,
  parseDate,
  getWeekDates,
  getWeekRangeString,
  getDayName,
  isSameDay,
  addWeeks,
  isToday,
  isPast,
  isFuture,
} from './date';

describe('date utilities', () => {
  describe('getWeekStart', () => {
    it('should get Monday for a date in the middle of the week', () => {
      const wednesday = new Date('2025-01-15'); // Wednesday
      const result = getWeekStart(wednesday);

      expect(result.getDay()).toBe(1); // Monday
      expect(formatDate(result)).toBe('2025-01-13');
    });

    it('should get Monday when date is already Monday', () => {
      const monday = new Date('2025-01-13'); // Monday
      const result = getWeekStart(monday);

      expect(result.getDay()).toBe(1);
      expect(formatDate(result)).toBe('2025-01-13');
    });

    it('should get Monday when date is Sunday', () => {
      const sunday = new Date('2025-01-19'); // Sunday
      const result = getWeekStart(sunday);

      expect(result.getDay()).toBe(1);
      expect(formatDate(result)).toBe('2025-01-13'); // Previous Monday
    });

    it('should get Monday when date is Saturday', () => {
      const saturday = new Date('2025-01-18'); // Saturday
      const result = getWeekStart(saturday);

      expect(result.getDay()).toBe(1);
      expect(formatDate(result)).toBe('2025-01-13');
    });

    it('should use current date when no argument provided', () => {
      const result = getWeekStart();

      expect(result.getDay()).toBe(1); // Should be Monday
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle year boundaries correctly', () => {
      const jan2 = new Date('2025-01-02'); // Thursday
      const result = getWeekStart(jan2);

      expect(result.getDay()).toBe(1);
      expect(formatDate(result)).toBe('2024-12-30'); // Monday in previous year
    });
  });

  describe('getWeekEnd', () => {
    it('should get Sunday for a date in the middle of the week', () => {
      const wednesday = new Date('2025-01-15'); // Wednesday
      const result = getWeekEnd(wednesday);

      expect(result.getDay()).toBe(0); // Sunday
      expect(formatDate(result)).toBe('2025-01-19');
    });

    it('should get Sunday when date is already Sunday', () => {
      const sunday = new Date('2025-01-19'); // Sunday
      const result = getWeekEnd(sunday);

      expect(result.getDay()).toBe(0);
      expect(formatDate(result)).toBe('2025-01-19');
    });

    it('should get Sunday when date is Monday', () => {
      const monday = new Date('2025-01-13'); // Monday
      const result = getWeekEnd(monday);

      expect(result.getDay()).toBe(0);
      expect(formatDate(result)).toBe('2025-01-19');
    });

    it('should use current date when no argument provided', () => {
      const result = getWeekEnd();

      expect(result.getDay()).toBe(0); // Should be Sunday
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2025-01-15');
      const result = formatDate(date);

      expect(result).toBe('2025-01-15');
    });

    it('should pad single-digit months and days', () => {
      const date = new Date('2025-03-05');
      const result = formatDate(date);

      expect(result).toBe('2025-03-05');
    });

    it('should handle December correctly', () => {
      const date = new Date('2025-12-31');
      const result = formatDate(date);

      expect(result).toBe('2025-12-31');
    });

    it('should handle January correctly', () => {
      const date = new Date('2025-01-01');
      const result = formatDate(date);

      expect(result).toBe('2025-01-01');
    });
  });

  describe('parseDate', () => {
    it('should parse YYYY-MM-DD to Date', () => {
      const result = parseDate('2025-01-15');

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January = 0
      expect(result.getDate()).toBe(15);
    });

    it('should set time to midnight', () => {
      const result = parseDate('2025-01-15');

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('should handle different months', () => {
      const result = parseDate('2025-12-25');

      expect(result.getMonth()).toBe(11); // December = 11
      expect(result.getDate()).toBe(25);
    });
  });

  describe('getWeekDates', () => {
    it('should return 7 dates starting from Monday', () => {
      const monday = new Date('2025-01-13');
      const result = getWeekDates(monday);

      expect(result).toHaveLength(7);
      expect(formatDate(result[0])).toBe('2025-01-13'); // Monday
      expect(formatDate(result[6])).toBe('2025-01-19'); // Sunday
    });

    it('should return dates in correct order (Mon-Sun)', () => {
      const monday = new Date('2025-01-13');
      const result = getWeekDates(monday);

      expect(result[0].getDay()).toBe(1); // Monday
      expect(result[1].getDay()).toBe(2); // Tuesday
      expect(result[2].getDay()).toBe(3); // Wednesday
      expect(result[3].getDay()).toBe(4); // Thursday
      expect(result[4].getDay()).toBe(5); // Friday
      expect(result[5].getDay()).toBe(6); // Saturday
      expect(result[6].getDay()).toBe(0); // Sunday
    });

    it('should handle month boundaries', () => {
      const monday = new Date('2025-01-27'); // Week spans into February
      const result = getWeekDates(monday);

      expect(formatDate(result[0])).toBe('2025-01-27');
      expect(formatDate(result[6])).toBe('2025-02-02');
    });
  });

  describe('getWeekRangeString', () => {
    it('should format week range within same month', () => {
      const monday = new Date('2025-01-13');
      const result = getWeekRangeString(monday);

      expect(result).toBe('Jan 13 - 19, 2025');
    });

    it('should format week range spanning two months', () => {
      const monday = new Date('2025-01-27');
      const result = getWeekRangeString(monday);

      expect(result).toBe('Jan 27 - Feb 2, 2025');
    });

    it('should format week range spanning years', () => {
      const monday = new Date('2024-12-30');
      const result = getWeekRangeString(monday);

      expect(result).toBe('Dec 30 - Jan 5, 2025');
    });

    it('should handle different months correctly', () => {
      const monday = new Date('2025-03-31');
      const result = getWeekRangeString(monday);

      expect(result).toBe('Mar 31 - Apr 6, 2025');
    });
  });

  describe('getDayName', () => {
    it('should return short day name by default', () => {
      const monday = new Date('2025-01-13');
      const result = getDayName(monday);

      expect(result).toBe('Mon');
    });

    it('should return long day name when short is false', () => {
      const monday = new Date('2025-01-13');
      const result = getDayName(monday, false);

      expect(result).toBe('Monday');
    });

    it('should return correct names for all days (short)', () => {
      const monday = new Date('2025-01-13');
      const dates = getWeekDates(monday);

      expect(getDayName(dates[0])).toBe('Mon');
      expect(getDayName(dates[1])).toBe('Tue');
      expect(getDayName(dates[2])).toBe('Wed');
      expect(getDayName(dates[3])).toBe('Thu');
      expect(getDayName(dates[4])).toBe('Fri');
      expect(getDayName(dates[5])).toBe('Sat');
      expect(getDayName(dates[6])).toBe('Sun');
    });

    it('should return correct names for all days (long)', () => {
      const monday = new Date('2025-01-13');
      const dates = getWeekDates(monday);

      expect(getDayName(dates[0], false)).toBe('Monday');
      expect(getDayName(dates[1], false)).toBe('Tuesday');
      expect(getDayName(dates[2], false)).toBe('Wednesday');
      expect(getDayName(dates[3], false)).toBe('Thursday');
      expect(getDayName(dates[4], false)).toBe('Friday');
      expect(getDayName(dates[5], false)).toBe('Saturday');
      expect(getDayName(dates[6], false)).toBe('Sunday');
    });
  });

  describe('isSameDay', () => {
    it('should return true for same date', () => {
      const date1 = new Date('2025-01-15T10:30:00');
      const date2 = new Date('2025-01-15T18:45:00');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = new Date('2025-01-15');
      const date2 = new Date('2025-01-16');

      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should ignore time differences', () => {
      const date1 = new Date('2025-01-15T00:00:00');
      const date2 = new Date('2025-01-15T23:59:59');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different months', () => {
      const date1 = new Date('2025-01-31');
      const date2 = new Date('2025-02-01');

      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for different years', () => {
      const date1 = new Date('2024-12-31');
      const date2 = new Date('2025-01-01');

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('addWeeks', () => {
    it('should add positive weeks', () => {
      const date = new Date('2025-01-13');
      const result = addWeeks(date, 2);

      expect(formatDate(result)).toBe('2025-01-27');
    });

    it('should subtract weeks with negative number', () => {
      const date = new Date('2025-01-27');
      const result = addWeeks(date, -2);

      expect(formatDate(result)).toBe('2025-01-13');
    });

    it('should handle zero weeks', () => {
      const date = new Date('2025-01-13');
      const result = addWeeks(date, 0);

      expect(formatDate(result)).toBe('2025-01-13');
    });

    it('should handle month boundaries', () => {
      const date = new Date('2025-01-27');
      const result = addWeeks(date, 1);

      expect(formatDate(result)).toBe('2025-02-03');
    });

    it('should handle year boundaries', () => {
      const date = new Date('2024-12-30');
      const result = addWeeks(date, 1);

      expect(formatDate(result)).toBe('2025-01-06');
    });

    it('should not mutate original date', () => {
      const date = new Date('2025-01-13');
      const original = formatDate(date);
      addWeeks(date, 2);

      expect(formatDate(date)).toBe(original);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      const result = isToday(today);

      expect(result).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(isToday(tomorrow)).toBe(false);
    });

    it('should ignore time of day', () => {
      const todayMorning = new Date();
      todayMorning.setHours(6, 0, 0, 0);

      expect(isToday(todayMorning)).toBe(true);
    });
  });

  describe('isPast', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(isPast(yesterday)).toBe(true);
    });

    it('should return false for today', () => {
      const today = new Date();

      expect(isPast(today)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(isPast(tomorrow)).toBe(false);
    });

    it('should return true for dates far in the past', () => {
      const pastDate = new Date('2020-01-01');

      expect(isPast(pastDate)).toBe(true);
    });

    it('should ignore time of day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59);

      expect(isPast(yesterday)).toBe(true);
    });
  });

  describe('isFuture', () => {
    it('should return true for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(isFuture(tomorrow)).toBe(true);
    });

    it('should return false for today', () => {
      const today = new Date();

      expect(isFuture(today)).toBe(false);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(isFuture(yesterday)).toBe(false);
    });

    it('should return true for dates far in the future', () => {
      const futureDate = new Date('2030-01-01');

      expect(isFuture(futureDate)).toBe(true);
    });

    it('should ignore time of day', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0);

      expect(isFuture(tomorrow)).toBe(true);
    });
  });
});
