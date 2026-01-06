export const msPerDay = 24 * 60 * 60 * 1000;

export type MaybeDate = Date | undefined;

export class DateCalculator {
  static parseDate(value: string | undefined): MaybeDate {
    if (!value) return undefined;
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? undefined : new Date(ms);
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static subDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  static subMonths(base: Date, months: number): Date {
    const date = new Date(base);
    date.setMonth(date.getMonth() - months);
    return date;
  }

  static isWithin(d: Date, startInclusive: Date, endExclusive: Date): boolean {
    return d.getTime() >= startInclusive.getTime() && d.getTime() < endExclusive.getTime();
  }
}
