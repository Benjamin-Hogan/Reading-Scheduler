import { addDays, format, isAfter, isBefore, isEqual, parseISO } from "date-fns";
import type { WeekdayKey } from "@/lib/db/schema";
import { formatDate, parseDate } from "@/lib/utils";

const WEEKDAY_MAP: Record<WeekdayKey, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function isActiveDay(date: Date, activeDays: WeekdayKey[]): boolean {
  return activeDays.includes(
    Object.entries(WEEKDAY_MAP).find(([, v]) => v === date.getDay())?.[0] as WeekdayKey
  );
}

export function countReadingDays(
  startDate: string,
  endDate: string,
  activeDays: WeekdayKey[]
): number {
  let count = 0;
  let current = parseDate(startDate);
  const end = parseDate(endDate);

  while (!isAfter(current, end)) {
    if (isActiveDay(current, activeDays)) count++;
    current = addDays(current, 1);
  }
  return count;
}

export function getReadingDaysList(
  startDate: string,
  endDate: string,
  activeDays: WeekdayKey[]
): string[] {
  const days: string[] = [];
  let current = parseDate(startDate);
  const end = parseDate(endDate);

  while (!isAfter(current, end)) {
    if (isActiveDay(current, activeDays)) {
      days.push(formatDate(current));
    }
    current = addDays(current, 1);
  }
  return days;
}

export function addReadingDays(
  startDate: string,
  numDays: number,
  activeDays: WeekdayKey[]
): string {
  if (numDays <= 0) return startDate;

  let current = parseDate(startDate);
  let counted = 0;

  while (counted < numDays) {
    if (isActiveDay(current, activeDays)) {
      counted++;
      if (counted === numDays) break;
    }
    current = addDays(current, 1);
  }

  return formatDate(current);
}

export function nextReadingDay(date: string, activeDays: WeekdayKey[]): string {
  let current = addDays(parseDate(date), 1);
  for (let i = 0; i < 14; i++) {
    if (isActiveDay(current, activeDays)) {
      return formatDate(current);
    }
    current = addDays(current, 1);
  }
  return formatDate(current);
}

export function compareDates(a: string, b: string): number {
  const da = parseDate(a);
  const db = parseDate(b);
  if (isEqual(da, db)) return 0;
  return isBefore(da, db) ? -1 : 1;
}

export function maxDate(a: string, b: string): string {
  return compareDates(a, b) >= 0 ? a : b;
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr + "T12:00:00"), "MMM d, yyyy");
}
