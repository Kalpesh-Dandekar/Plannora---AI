const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type SupportedDateInput = string | Date | null | undefined;

export function normalizeDateOnly(value: SupportedDateInput): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toDateOnly(value);
  }
  if (typeof value !== "string") return null;
  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? value
      : null;
  }
  const legacyDate = new Date(value);
  return Number.isNaN(legacyDate.getTime()) ? null : toDateOnly(legacyDate);
}

export function parseDateOnly(value: SupportedDateInput): Date | null {
  const normalized = normalizeDateOnly(value);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date;
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addCalendarDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function calendarDaysBetween(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}

export function daysRemaining(dateOnly: SupportedDateInput, now = new Date()): number | null {
  const date = parseDateOnly(dateOnly);
  if (!date) return null;
  return Math.max(0, calendarDaysBetween(startOfLocalDay(now), date));
}

export function startOfWeek(date = new Date()): Date {
  const start = startOfLocalDay(date);
  const mondayOffset = (start.getDay() + 6) % 7;
  return addCalendarDays(start, -mondayOffset);
}
