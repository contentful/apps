export const msPerDay = 24 * 60 * 60 * 1000;

export type MaybeDate = Date | undefined;

export function parseDate(value: string | undefined): MaybeDate {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : new Date(ms);
}

export function addDays(date: Date, days: number): Date {
  date.setDate(date.getDate() + days);
  return date;
}

export function subDays(date: Date, days: number): Date {
  date.setDate(date.getDate() - days);
  return date;
}

export function subMonths(base: Date, months: number): Date {
  const date = new Date(base);
  date.setMonth(date.getMonth() - months);
  return date;
}

export function isWithin(d: Date, startInclusive: Date, endExclusive: Date): boolean {
  return d.getTime() >= startInclusive.getTime() && d.getTime() < endExclusive.getTime();
}
