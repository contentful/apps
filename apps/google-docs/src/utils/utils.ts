export const truncateLabel = (label: string, maxLength: number = 10): string =>
  label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
