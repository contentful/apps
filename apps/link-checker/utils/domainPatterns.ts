export function normalizeDomainPattern(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  try {
    return new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    ).hostname.toLowerCase();
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').toLowerCase();
  }
}

function getHostname(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function urlMatchesAnyDomainPattern(url: string, patterns: string[]): boolean {
  if (!patterns.length) return false;

  const hostname = getHostname(url);
  if (!hostname) return false;

  return patterns.some((pattern) => {
    const normalizedPattern = normalizeDomainPattern(pattern);
    return (
      Boolean(normalizedPattern) &&
      (hostname === normalizedPattern || hostname.endsWith(`.${normalizedPattern}`))
    );
  });
}
