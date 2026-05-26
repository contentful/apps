import type { KeyboardEvent, ChangeEvent } from 'react';

export function onEnterToggleCheckbox(
  isChecked: boolean,
  onChange: (checked: boolean) => void
): (e: KeyboardEvent) => void {
  return (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange(!isChecked);
    }
  };
}

export function onEnterToggleMultiselectOption(
  value: string,
  isChecked: boolean,
  onSelectItem: (e: ChangeEvent<HTMLInputElement>) => void
): (e: KeyboardEvent) => void {
  return (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSelectItem({ target: { checked: !isChecked, value } } as ChangeEvent<HTMLInputElement>);
    }
  };
}
