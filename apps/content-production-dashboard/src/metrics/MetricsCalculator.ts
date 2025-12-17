import { FileIcon } from '@contentful/f36-icons';
import type { EntryProps } from 'contentful-management';
import { ClockIcon } from '@contentful/f36-icons';
import type { MetricCardProps } from '../components/MetricCard';

const msPerDay = 24 * 60 * 60 * 1000;

type MaybeDate = Date | undefined;

function parseDate(value: string | undefined): MaybeDate {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : new Date(ms);
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

export class MetricsCalculator {
  private readonly entries: ReadonlyArray<EntryProps>;
  private readonly now: Date; // to maintain all the metrics consistent at the same current time

  public readonly metrics: ReadonlyArray<MetricCardProps>;

  constructor(entries: ReadonlyArray<EntryProps>) {
    this.entries = entries;
    this.now = new Date();

    // Calculate once at construction time (per your request).
    this.metrics = [this.calculateTotalPublished(), this.calculateAverageTimeToPublish()];
  }

  private getPublishedAt(entry: EntryProps): MaybeDate {
    return parseDate(entry?.sys?.publishedAt);
  }

  private getCreatedAt(entry: EntryProps): MaybeDate {
    return parseDate(entry?.sys?.createdAt);
  }

  private calculateTotalPublished(): MetricCardProps {
    const startThisPeriod = subDays(this.now, 30);
    const startPrevPeriod = subDays(this.now, 60);
    const endPrevPeriod = startThisPeriod;

    let current = 0;
    let previous = 0;
    for (const entry of this.entries) {
      const publishedAt = this.getPublishedAt(entry);
      if (!publishedAt) continue;

      if (isWithin(publishedAt, startThisPeriod, this.now)) {
        current += 1;
        continue;
      }
      if (isWithin(publishedAt, startPrevPeriod, endPrevPeriod)) {
        previous += 1;
      }
    }

    const { text, isNegative } = percentChange(current, previous);

    return {
      title: 'Total Published',
      value: String(current),
      subtitle: text,
      icon: FileIcon,
      isNegative,
    };
  }

  private calculateAverageTimeToPublish(): MetricCardProps {
    const startThisPeriod = subDays(this.now, 30);

    let sumDays = 0;
    let count = 0;
    for (const entry of this.entries) {
      const publishedAt = this.getPublishedAt(entry);
      if (!publishedAt) continue;
      if (!isWithin(publishedAt, startThisPeriod, this.now)) continue;

      const createdAt = this.getCreatedAt(entry);
      if (!createdAt) continue;

      const deltaDays = (publishedAt.getTime() - createdAt.getTime()) / msPerDay;
      if (deltaDays < 0) continue;

      sumDays += deltaDays;
      count += 1;
    }

    const avg = count === 0 ? undefined : sumDays / count;

    return {
      title: 'Average Time to Publish',
      value: avg === undefined ? '—' : `${avg.toFixed(1)} days`,
      subtitle: count === 0 ? 'No entries published in the last 30 days' : 'For the last 30 days',
      icon: ClockIcon,
      isNegative: false,
    };
  }
}
