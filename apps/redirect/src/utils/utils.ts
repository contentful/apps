export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const isNumericSearch = (query: string): boolean => {
  const decimalPattern = /^-?\d*\.?\d+$/;
  const integerPattern = /^-?\d+$/;
  return decimalPattern.test(query.trim()) || integerPattern.test(query.trim());
};
