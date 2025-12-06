import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addDays, diffInDays, getToday } from './date';

describe('date utilities', () => {
  describe('addDays', () => {
    it('should add positive days to a date', () => {
      const baseDate = new Date('2025-01-15');
      const result = addDays(baseDate, 5);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(20);
    });

    it('should subtract days when given negative number', () => {
      const baseDate = new Date('2025-01-15');
      const result = addDays(baseDate, -5);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(10);
    });

    it('should handle month boundary correctly', () => {
      const baseDate = new Date('2025-01-30');
      const result = addDays(baseDate, 5);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });

    it('should handle year boundary correctly', () => {
      const baseDate = new Date('2024-12-30');
      const result = addDays(baseDate, 5);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(4);
    });

    it('should not mutate the original date', () => {
      const baseDate = new Date('2025-01-15');
      const originalTime = baseDate.getTime();
      addDays(baseDate, 10);
      expect(baseDate.getTime()).toBe(originalTime);
    });

    it('should handle zero days', () => {
      const baseDate = new Date('2025-01-15');
      const result = addDays(baseDate, 0);
      expect(result.getDate()).toBe(15);
    });
  });

  describe('diffInDays', () => {
    it('should return positive when date1 is in the future', () => {
      const date1 = new Date('2025-01-20');
      const date2 = new Date('2025-01-15');
      expect(diffInDays(date1, date2)).toBe(5);
    });

    it('should return negative when date1 is in the past', () => {
      const date1 = new Date('2025-01-15');
      const date2 = new Date('2025-01-20');
      expect(diffInDays(date1, date2)).toBe(-5);
    });

    it('should return zero for the same date', () => {
      const date1 = new Date('2025-01-15');
      const date2 = new Date('2025-01-15');
      expect(diffInDays(date1, date2)).toBe(0);
    });

    it('should return zero for same date with different times', () => {
      const date1 = new Date('2025-01-15T10:30:00');
      const date2 = new Date('2025-01-15T22:45:00');
      expect(diffInDays(date1, date2)).toBe(0);
    });

    it('should handle month boundaries', () => {
      const date1 = new Date('2025-02-05');
      const date2 = new Date('2025-01-25');
      expect(diffInDays(date1, date2)).toBe(11);
    });

    it('should handle year boundaries', () => {
      const date1 = new Date('2025-01-05');
      const date2 = new Date('2024-12-25');
      expect(diffInDays(date1, date2)).toBe(11);
    });

    it('should not mutate original dates', () => {
      const date1 = new Date('2025-01-20T14:30:00');
      const date2 = new Date('2025-01-15T08:00:00');
      const originalTime1 = date1.getTime();
      const originalTime2 = date2.getTime();

      diffInDays(date1, date2);

      expect(date1.getTime()).toBe(originalTime1);
      expect(date2.getTime()).toBe(originalTime2);
    });
  });

  describe('getToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return today with time set to 00:00:00', () => {
      vi.setSystemTime(new Date('2025-06-15T14:30:45.123'));

      const today = getToday();

      expect(today.getFullYear()).toBe(2025);
      expect(today.getMonth()).toBe(5); // June
      expect(today.getDate()).toBe(15);
      expect(today.getHours()).toBe(0);
      expect(today.getMinutes()).toBe(0);
      expect(today.getSeconds()).toBe(0);
      expect(today.getMilliseconds()).toBe(0);
    });

    it('should return a new Date instance each time', () => {
      vi.setSystemTime(new Date('2025-06-15'));

      const today1 = getToday();
      const today2 = getToday();

      expect(today1).not.toBe(today2);
      expect(today1.getTime()).toBe(today2.getTime());
    });
  });
});
