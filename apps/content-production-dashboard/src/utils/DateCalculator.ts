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

  static formatMonthYear(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  static formatMonthYearDisplay(monthYear: string): string {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  static generateMonthRange(startDate: Date, endDate: Date): string[] {
    const months: string[] = [];
    const current = new Date(startDate);
    current.setDate(1);
    current.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      months.push(DateCalculator.formatMonthYear(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }
}
