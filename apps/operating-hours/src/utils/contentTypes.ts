export function slugifyFieldId(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized) {
    return 'store-hours';
  }

  return normalized.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

export function ensureUniqueFieldId(desiredFieldId: string, existingFieldIds: string[]) {
  if (!existingFieldIds.includes(desiredFieldId)) {
    return desiredFieldId;
  }

  let suffix = 2;
  let candidate = `${desiredFieldId}${suffix}`;

  while (existingFieldIds.includes(candidate)) {
    suffix += 1;
    candidate = `${desiredFieldId}${suffix}`;
  }

  return candidate;
}
