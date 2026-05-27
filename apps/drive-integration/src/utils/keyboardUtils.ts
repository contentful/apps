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

export function onEnterToggleMultiselectContainer(
  onSelectItem: (e: ChangeEvent<HTMLInputElement>) => void
): (e: KeyboardEvent<HTMLElement>) => void {
  return (e) => {
    if (e.key === 'Enter') {
      const input = e.target as HTMLInputElement;
      if (input.type === 'checkbox' && input.value) {
        e.preventDefault();
        onSelectItem({
          target: { checked: !input.checked, value: input.value },
        } as ChangeEvent<HTMLInputElement>);
      }
    }
  };
}
