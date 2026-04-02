export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

export type IconPosition = string;

export const ICON_WEIGHTS: IconWeight[] = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'];

export const ICON_WEIGHT_LABELS: Record<IconWeight, string> = {
  thin: 'Thin',
  light: 'Light',
  regular: 'Regular',
  bold: 'Bold',
  fill: 'Fill',
  duotone: 'Duotone',
};

export const DEFAULT_ICON_POSITIONS: IconPosition[] = ['start', 'end'];

export interface IconFieldValue {
  name: string;
  componentName: string;
  weight: IconWeight;
  position: IconPosition;
}

export interface IconCatalogEntry {
  name: string;
  componentName: string;
  tags: string[];
  categories: string[];
}

export function formatPositionLabel(position: string) {
  const formattedPosition = position.trim().replace(/[-_]+/g, ' ').toLowerCase();

  return formattedPosition.charAt(0).toUpperCase() + formattedPosition.slice(1);
}
