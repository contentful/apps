import { DEFAULT_ICON_POSITIONS, IconFieldValue, IconWeight } from './icon';

export type IconAvailabilityMode = 'all' | 'specific';
export type DialogSelectionMode = 'single' | 'multi';

export interface AppInstallationParameters {
  enabledWeights: IconWeight[] | string;
  selectedContentTypeIds?: string[];
  managedFieldId?: string;
  managedFieldName?: string;
  iconAvailabilityMode?: IconAvailabilityMode;
  selectedIconNames?: string[] | string;
  positionOptions?: string[] | string;
}

function parseStringArray(rawValue: string[] | string | undefined, fallback: string[]) {
  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export function parseEnabledWeights(
  raw: AppInstallationParameters['enabledWeights'],
  fallback: IconWeight[] = ['regular']
): IconWeight[] {
  const parsed = parseStringArray(raw, fallback);
  const weights = parsed.filter((item): item is IconWeight =>
    ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'].includes(item)
  );

  return weights.length > 0 ? weights : fallback;
}

export function serializeEnabledWeights(weights: IconWeight[]): string {
  return JSON.stringify(weights);
}

export function parseSelectedIconNames(
  raw: AppInstallationParameters['selectedIconNames']
): string[] {
  return Array.from(new Set(parseStringArray(raw, [])));
}

export function serializeSelectedIconNames(iconNames: string[]): string {
  return JSON.stringify(Array.from(new Set(iconNames)));
}

export function normalizePositionOptions(positionOptions: string[]): string[] {
  const normalized = positionOptions
    .map((position) => position.trim())
    .filter(Boolean)
    .filter((position, index, positions) => positions.indexOf(position) === index);

  return normalized.length > 0 ? normalized : DEFAULT_ICON_POSITIONS;
}

export function parsePositionOptions(raw: AppInstallationParameters['positionOptions']): string[] {
  return normalizePositionOptions(parseStringArray(raw, DEFAULT_ICON_POSITIONS));
}

export function serializePositionOptions(positionOptions: string[]): string {
  return JSON.stringify(normalizePositionOptions(positionOptions));
}

export interface DialogInvocationParameters {
  currentValue?: IconFieldValue;
  enabledWeights: IconWeight[];
  positionOptions: string[];
  mode?: DialogSelectionMode;
  selectedIconNames?: string[];
  allowedIconNames?: string[];
}
