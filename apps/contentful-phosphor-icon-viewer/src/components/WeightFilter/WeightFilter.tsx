import { Select } from '@contentful/f36-components';
import type { IconWeight } from '../../types/icon';
import { ICON_WEIGHT_LABELS } from '../../types/icon';

interface WeightFilterProps {
  value: IconWeight;
  onChange: (weight: IconWeight) => void;
  enabledWeights: IconWeight[];
}

export function WeightFilter({ value, onChange, enabledWeights }: WeightFilterProps) {
  return (
    <Select
      id="weight-filter"
      name="weight-filter"
      value={value}
      onChange={(e) => onChange(e.target.value as IconWeight)}
      aria-label="Filter by weight">
      {enabledWeights.map((weight) => (
        <Select.Option key={weight} value={weight}>
          {ICON_WEIGHT_LABELS[weight]}
        </Select.Option>
      ))}
    </Select>
  );
}
