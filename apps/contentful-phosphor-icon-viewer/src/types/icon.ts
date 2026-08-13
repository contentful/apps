/**
 * Available icon weights in Phosphor Icons (excluding duotone per requirements)
 */
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill';

/**
 * Icon position relative to content
 */
export type IconPosition = 'before' | 'after';

/**
 * All available icon weights for iteration
 */
export const ICON_WEIGHTS: IconWeight[] = ['thin', 'light', 'regular', 'bold', 'fill'];

/**
 * Display labels for icon weights
 */
export const ICON_WEIGHT_LABELS: Record<IconWeight, string> = {
  thin: 'Thin',
  light: 'Light',
  regular: 'Regular',
  bold: 'Bold',
  fill: 'Fill',
};

/**
 * All available icon positions for iteration
 */
export const ICON_POSITIONS: IconPosition[] = ['before', 'after'];

/**
 * Display labels for icon positions
 */
export const ICON_POSITION_LABELS: Record<IconPosition, string> = {
  before: 'Before',
  after: 'After',
};

/**
 * The JSON value stored in the Contentful field
 * Enables React usage: <AirplaneTilt weight="regular" size={32} />
 */
export interface IconFieldValue {
  /** Kebab-case icon name (e.g., "airplane-tilt") */
  name: string;
  /** PascalCase React component name (e.g., "AirplaneTilt") */
  componentName: string;
  /** Selected icon weight */
  weight: IconWeight;
  /** Position relative to content (before or after) */
  position: IconPosition;
}

/**
 * Entry in the icon catalog from @phosphor-icons/core
 */
export interface IconCatalogEntry {
  /** Kebab-case icon name */
  name: string;
  /** PascalCase component name for React */
  componentName: string;
  /** Search tags for fuzzy matching */
  tags: string[];
  /** Category of the icon */
  categories: string[];
}
