import { Select, FormControl } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

/**
 * Date range options for analytics queries.
 * Matches the DateRange type from data-model.md
 */
export type DateRange = 'today' | 'last7days' | 'last30days';

export interface DateRangeSelectorProps {
  /** Currently selected date range */
  value: DateRange;
  /** Callback when date range changes */
  onChange: (range: DateRange) => void;
  /** Whether the selector is disabled */
  isDisabled?: boolean;
  /** Optional label (defaults to "Date range") */
  label?: string;
  /** Hide the label visually (still accessible) */
  hideLabel?: boolean;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
];

const styles = {
  formControl: css({
    marginBottom: 0,
  }),
  select: css({
    minWidth: '120px',
  }),
  visuallyHidden: css({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  }),
};

/**
 * A date range selector component for filtering analytics data.
 * Provides options for today, last 7 days, and last 30 days.
 */
export function DateRangeSelector({
  value,
  onChange,
  isDisabled = false,
  label = 'Date range',
  hideLabel = false,
}: DateRangeSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as DateRange);
  };

  return (
    <FormControl className={styles.formControl}>
      <FormControl.Label className={hideLabel ? styles.visuallyHidden : undefined}>
        {label}
      </FormControl.Label>
      <Select
        id="date-range-selector"
        name="dateRange"
        value={value}
        onChange={handleChange}
        isDisabled={isDisabled}
        className={styles.select}>
        {DATE_RANGE_OPTIONS.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </FormControl>
  );
}

export default DateRangeSelector;
