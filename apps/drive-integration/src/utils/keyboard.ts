export const handleMultiselectKeyDown = (e: React.KeyboardEvent) => {
  if (e.key !== 'Enter') return;
  const target = e.target as HTMLInputElement;
  if (target.type === 'checkbox') target.click();
};
