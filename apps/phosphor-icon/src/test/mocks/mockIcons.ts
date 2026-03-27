import type { IconCatalogEntry, IconFieldValue } from '../../types/icon';

/**
 * Sample icon catalog entries for testing
 */
export const mockIconCatalog: IconCatalogEntry[] = [
  {
    name: 'airplane',
    componentName: 'Airplane',
    tags: ['travel', 'flight', 'plane', 'transportation'],
    categories: ['map'],
  },
  {
    name: 'airplane-tilt',
    componentName: 'AirplaneTilt',
    tags: ['travel', 'flight', 'plane', 'transportation', 'takeoff'],
    categories: ['map'],
  },
  {
    name: 'alarm',
    componentName: 'Alarm',
    tags: ['clock', 'time', 'wake', 'alert'],
    categories: ['system'],
  },
  {
    name: 'anchor',
    componentName: 'Anchor',
    tags: ['marine', 'boat', 'ship', 'nautical'],
    categories: ['map'],
  },
  {
    name: 'archive',
    componentName: 'Archive',
    tags: ['storage', 'box', 'save', 'folder'],
    categories: ['office'],
  },
  {
    name: 'arrow-right',
    componentName: 'ArrowRight',
    tags: ['direction', 'navigation', 'next', 'forward'],
    categories: ['arrows'],
  },
  {
    name: 'bell',
    componentName: 'Bell',
    tags: ['notification', 'alert', 'ring', 'alarm'],
    categories: ['system'],
  },
  {
    name: 'book',
    componentName: 'Book',
    tags: ['read', 'library', 'education', 'learning'],
    categories: ['education'],
  },
  {
    name: 'calendar',
    componentName: 'Calendar',
    tags: ['date', 'schedule', 'event', 'time'],
    categories: ['office'],
  },
  {
    name: 'camera',
    componentName: 'Camera',
    tags: ['photo', 'picture', 'image', 'photography'],
    categories: ['media'],
  },
  {
    name: 'check',
    componentName: 'Check',
    tags: ['done', 'complete', 'success', 'confirm'],
    categories: ['system'],
  },
  {
    name: 'clock',
    componentName: 'Clock',
    tags: ['time', 'hour', 'minute', 'watch'],
    categories: ['system'],
  },
  {
    name: 'cloud',
    componentName: 'Cloud',
    tags: ['weather', 'sky', 'storage', 'upload'],
    categories: ['weather'],
  },
  {
    name: 'code',
    componentName: 'Code',
    tags: ['programming', 'developer', 'brackets', 'html'],
    categories: ['development'],
  },
  {
    name: 'heart',
    componentName: 'Heart',
    tags: ['love', 'like', 'favorite', 'health'],
    categories: ['health'],
  },
];

/**
 * Sample field value for testing
 */
export const mockFieldValue: IconFieldValue = {
  name: 'airplane-tilt',
  componentName: 'AirplaneTilt',
  weight: 'regular',
  position: 'before',
};

/**
 * Creates a mock icon field value
 */
export function createMockIconFieldValue(overrides: Partial<IconFieldValue> = {}): IconFieldValue {
  return {
    ...mockFieldValue,
    ...overrides,
  };
}

/**
 * Creates a mock icon catalog entry
 */
export function createMockIconCatalogEntry(
  overrides: Partial<IconCatalogEntry> = {}
): IconCatalogEntry {
  return {
    name: 'test-icon',
    componentName: 'TestIcon',
    tags: ['test'],
    categories: ['test'],
    ...overrides,
  };
}
