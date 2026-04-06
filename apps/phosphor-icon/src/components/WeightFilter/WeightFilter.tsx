import { Select, TextInput } from '@contentful/f36-components';
import type { IconWeight } from '../../types/icon';
import { ICON_WEIGHT_LABELS } from '../../types/icon';

interface WeightFilterProps {
  value: IconWeight;
  onChange: (weight: IconWeight) => void;
  enabledWeights: IconWeight[];
  forceSelect?: boolean;
}

export function WeightFilter({
  value,
  onChange,
  enabledWeights,
  forceSelect = false,
}: WeightFilterProps) {
  if (enabledWeights.length === 1 && !forceSelect) {
    return <TextInput value={ICON_WEIGHT_LABELS[value]} isDisabled aria-label="Style" />;
  }

  return (
    <Select
      id="weight-filter"
      name="weight-filter"
      value={value}
      onChange={(e) => onChange(e.target.value as IconWeight)}
      aria-label="Select icon style">
      {enabledWeights.map((weight) => (
        <Select.Option key={weight} value={weight}>
          {ICON_WEIGHT_LABELS[weight]}
        </Select.Option>
      ))}
    </Select>
  );
}
