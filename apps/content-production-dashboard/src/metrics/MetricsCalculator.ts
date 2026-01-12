import type { EntryProps, ScheduledActionProps } from 'contentful-management';
import type { MetricCardProps } from '../components/MetricCard';
import {
  NEEDS_UPDATE_MONTHS_RANGE,
  RECENTLY_PUBLISHED_DAYS_RANGE,
  TIME_TO_PUBLISH_DAYS_RANGE,
} from '../utils/consts';
import { DateCalculator, msPerDay } from '../utils/DateCalculator';

export class MetricsCalculator {
  private readonly entries: ReadonlyArray<EntryProps>;
  private readonly scheduledActions: ReadonlyArray<ScheduledActionProps>;
  private readonly now: Date; // to maintain all the metrics consistent at the same current time
  private readonly needsUpdateMonths: number;
  private readonly recentlyPublishedDays: number;
  private readonly timeToPublishDays: number;

  constructor(
    entries: ReadonlyArray<EntryProps>,
    scheduledActions: ReadonlyArray<ScheduledActionProps>,
    options?: {
      needsUpdateMonths?: number;
      recentlyPublishedDays?: number;
      timeToPublishDays?: number;
    }
  ) {
    this.entries = entries;
    this.scheduledActions = scheduledActions;
    this.now = new Date();
    this.needsUpdateMonths = options?.needsUpdateMonths ?? NEEDS_UPDATE_MONTHS_RANGE.min;
    this.recentlyPublishedDays =
      options?.recentlyPublishedDays ?? RECENTLY_PUBLISHED_DAYS_RANGE.min;
    this.timeToPublishDays = options?.timeToPublishDays ?? TIME_TO_PUBLISH_DAYS_RANGE.min;
  }

  public getAllMetrics(): ReadonlyArray<MetricCardProps> {
    return [
      this.calculateTotalPublished(),
      this.calculateAverageTimeToPublish(),
      this.calculateScheduled(),
      this.calculateRecentlyPublished(),
      this.calculateNeedsUpdate(),
    ];
  }

  private calculatePublishingChangeText(
    current: number,
    previous: number
  ): { text: string; isNegative: boolean } {
    if (previous === 0) {
      if (current === 0) return { text: '0.0% publishing change MoM', isNegative: false };
      return { text: 'New publishing this month', isNegative: false };
    }
    const pct = ((current - previous) / previous) * 100;
    const abs = Math.abs(pct).toFixed(1);
    const direction = pct < 0 ? 'decrease' : 'increase';
    return { text: `${abs}% publishing ${direction} MoM`, isNegative: pct < 0 };
  }

  private calculateTotalPublished(): MetricCardProps {
    const startThisPeriod = DateCalculator.subDays(this.now, 30);
    const startPrevPeriod = DateCalculator.subDays(this.now, 60);
    const endPrevPeriod = startThisPeriod;

    let current = 0;
    let previous = 0;
    for (const entry of this.entries) {
      const publishedAt = DateCalculator.parseDate(entry?.sys?.publishedAt);
      if (!publishedAt) continue;

      if (DateCalculator.isWithin(publishedAt, startThisPeriod, this.now)) {
        current += 1;
        continue;
      }
      if (DateCalculator.isWithin(publishedAt, startPrevPeriod, endPrevPeriod)) {
        previous += 1;
      }
    }

    const { text, isNegative } = this.calculatePublishingChangeText(current, previous);

    return {
      title: 'Total Published',
      value: String(current),
      subtitle: text,
      isNegative,
    };
  }

  private calculateAverageTimeToPublish(): MetricCardProps {
    const startThisPeriod = DateCalculator.subDays(this.now, this.timeToPublishDays);

    let sumDays = 0;
    let count = 0;
    for (const entry of this.entries) {
      const publishedAt = DateCalculator.parseDate(entry?.sys?.publishedAt);
      if (!publishedAt) continue;
      if (!DateCalculator.isWithin(publishedAt, startThisPeriod, this.now)) continue;

      const createdAt = DateCalculator.parseDate(entry?.sys?.createdAt);
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
      subtitle:
        count === 0
          ? `No entries published in the last ${this.timeToPublishDays} days`
          : `For the last ${this.timeToPublishDays} days`,
      isNegative: false,
    };
  }

  private calculateScheduled(): MetricCardProps {
    const end = DateCalculator.addDays(this.now, 30);

    let count = 0;
    for (const action of this.scheduledActions) {
      const scheduledFor = DateCalculator.parseDate(action?.scheduledFor?.datetime);
      if (!scheduledFor) continue;
      if (DateCalculator.isWithin(scheduledFor, this.now, end)) {
        count += 1;
      }
    }

    return {
      title: 'Scheduled',
      value: String(count),
      subtitle: 'For the next 30 days',
      isNegative: false,
    };
  }

  private calculateRecentlyPublished(): MetricCardProps {
    const start = DateCalculator.subDays(this.now, this.recentlyPublishedDays);

    let count = 0;
    for (const entry of this.entries) {
      const publishedAt = DateCalculator.parseDate(entry?.sys?.publishedAt);
      if (!publishedAt) continue;
      if (DateCalculator.isWithin(publishedAt, start, this.now)) {
        count += 1;
      }
    }

    return {
      title: 'Recently Published',
      value: String(count),
      subtitle: `In the last ${this.recentlyPublishedDays} days`,
      isNegative: false,
    };
  }

  private calculateNeedsUpdate(): MetricCardProps {
    const cutoff = DateCalculator.subMonths(this.now, this.needsUpdateMonths);

    let count = 0;
    for (const entry of this.entries) {
      const updatedAt = DateCalculator.parseDate(entry?.sys?.updatedAt);
      if (!updatedAt) continue;
      if (updatedAt.getTime() < cutoff.getTime()) {
        count += 1;
      }
    }

    return {
      title: 'Needs Update',
      value: String(count),
      subtitle: `Content older than ${this.needsUpdateMonths} months`,
      isNegative: false,
    };
  }
}
