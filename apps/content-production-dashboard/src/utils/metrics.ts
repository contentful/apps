export function percentChange(
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
