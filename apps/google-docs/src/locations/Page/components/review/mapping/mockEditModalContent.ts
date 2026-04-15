import type { EditModalContent } from '@types';

export const mockExcludeSelection: EditModalContent = {
  selectedText: 'Sample selected content',
  isOpen: true,
  currentLocations: [
    {
      id: 'mock-summary',
      contentTypeId: 'sampleContentType',
      entryName: 'Sample entry',
      fieldId: 'summary',
      fieldName: 'Summary',
      fieldType: 'Text',
      sourceRef: {
        type: 'blockText',
        blockId: 'mock-block-1',
        start: 0,
        end: 23,
        flattenedRuns: [
          {
            start: 0,
            end: 23,
            text: 'Sample selected content',
            styles: {},
          },
        ],
      },
      isSelected: true,
    },
    {
      id: 'mock-description',
      contentTypeId: 'sampleContentType',
      entryName: 'Sample entry',
      fieldId: 'description',
      fieldName: 'Description',
      fieldType: 'Symbol',
      sourceRef: {
        type: 'blockText',
        blockId: 'mock-block-2',
        start: 0,
        end: 23,
        flattenedRuns: [
          {
            start: 0,
            end: 23,
            text: 'Sample selected content',
            styles: {},
          },
        ],
      },
    },
  ],
};

export const mockNewLocationSelection: EditModalContent = {
  selectedText: 'Hot coffee, haute content, on us.',
  isOpen: true,
  currentLocations: [],
  newLocations: [
    {
      title: "Page: Event detail (Don't enter NRF uncaffeinated.)",
    },
    {
      title: "Component: Resource detail hero (Don't enter NRF uncaffeinated.)",
    },
  ],
};
