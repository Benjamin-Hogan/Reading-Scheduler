import type { ScheduleInput } from "./types";
import { buildFullSchedule } from "./preview";
import { compareDates, maxDate, isActiveDay } from "./dates";
import { formatDate, parseDate } from "@/lib/utils";
import type { WeekdayKey } from "@/lib/db/schema";
import { addDays } from "date-fns";

/**
 * Rebuild a schedule from the given date forward, using each book's current page.
 */
export function buildScheduleFromDate(
  input: ScheduleInput,
  fromDate: string
): ReturnType<typeof buildFullSchedule> {
  const effectiveStart = maxDate(fromDate, input.startDate);
  return buildFullSchedule({
    ...input,
    startDate: effectiveStart,
  });
}

/**
 * Pick the next reading day on or after today for regeneration.
 */
export function getRegenerationStartDate(
  planStartDate: string,
  activeDays: WeekdayKey[],
  today: string = formatDate(new Date())
): string {
  if (compareDates(today, planStartDate) < 0) {
    return planStartDate;
  }

  const start = maxDate(today, planStartDate);
  if (isActiveDay(parseDate(start), activeDays)) {
    return start;
  }
  let current = parseDate(start);
  for (let i = 0; i < 14; i++) {
    if (isActiveDay(current, activeDays)) {
      return formatDate(current);
    }
    current = addDays(current, 1);
  }
  return start;
}
