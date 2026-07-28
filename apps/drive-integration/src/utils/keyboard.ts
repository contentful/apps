import { KeyboardEvent } from 'react';

export const handleMultiselectKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Enter') return;
  const target = e.target as HTMLInputElement;
  if (target.type === 'checkbox') {
    e.preventDefault();
    target.click();
    setTimeout(() => target.focus(), 0);
  }
};
