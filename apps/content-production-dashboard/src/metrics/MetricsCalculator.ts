import { FileIcon } from '@contentful/f36-icons';
import type { EntryProps } from 'contentful-management';
import { MetricCardProps } from '../components/MetricCard';

const msPerDay = 24 * 60 * 60 * 1000;

function toDate(value: unknown) {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value !== 'string') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function subDays(base: Date, days: number): Date {
  return new Date(base.getTime() - days * msPerDay);
}

function isWithin(d: Date, startInclusive: Date, endExclusive: Date): boolean {
  return d.getTime() >= startInclusive.getTime() && d.getTime() < endExclusive.getTime();
}

function percentChange(current: number, previous: number): { text: string; isNegative: boolean } {
  if (previous === 0) {
    if (current === 0) return { text: '0.0% publishing change MoM', isNegative: false };
    return { text: 'New publishing this month', isNegative: false };
  }
  const pct = ((current - previous) / previous) * 100;
  const abs = Math.abs(pct).toFixed(1);
  const direction = pct < 0 ? 'decrease' : 'increase';
  return { text: `${abs}% publishing ${direction} MoM`, isNegative: pct < 0 };
}

const getPublishedAt = (entry: EntryProps): Date | undefined => {
  return toDate(entry?.sys?.publishedAt ?? entry?.sys?.firstPublishedAt);
};

export class MetricsCalculator {
  private readonly entries: ReadonlyArray<EntryProps>;
  private readonly now: Date; // to maintain all the metrics consistent at the same current time

  public readonly metrics: ReadonlyArray<MetricCardProps>;

  constructor(entries: ReadonlyArray<EntryProps>) {
    this.entries = entries;
    this.now = new Date();

    // Calculate once at construction time (per your request).
    this.metrics = [this.calculateTotalPublished()];
  }

  private calculateTotalPublished(): MetricCardProps {
    const startThisPeriod = subDays(this.now, 30);
    const startPrevPeriod = subDays(this.now, 60);
    const endPrevPeriod = startThisPeriod;

    const publishedDates = this.entries
      .map((e) => getPublishedAt(e))
      .filter((d): d is Date => Boolean(d));

    const current = publishedDates.filter((d) => isWithin(d, startThisPeriod, this.now)).length;
    const previous = publishedDates.filter((d) =>
      isWithin(d, startPrevPeriod, endPrevPeriod)
    ).length;

    const { text, isNegative } = percentChange(current, previous);

    return {
      title: 'Total Published',
      value: String(current),
      subtitle: text,
      icon: FileIcon,
      isNegative,
    };
  }
}
