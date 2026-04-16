import type { EditModalContent, EditModalNewLocation } from '@types';

/** Placeholder destinations until assign flow is backed by real entry/field data. */
export const placeholderAssignNewLocations: EditModalNewLocation[] = [
  {
    id: 'page-event-detail',
    title: "Page: Event detail (Don't enter NRF uncaffeinated.)",
    selectedFieldIds: ['name', 'description'],
    fieldMappings: [{ fieldId: 'name' }, { fieldId: 'description' }],
    fieldOptions: [
      { id: 'name', fieldName: 'Name (Internal)', fieldType: 'Short text' },
      { id: 'marketo', fieldName: 'Marketo', fieldType: 'Reference' },
      { id: 'title', fieldName: 'Title', fieldType: 'Short text' },
      { id: 'headingSize', fieldName: 'Heading size', fieldType: 'Integer' },
      { id: 'subtitle', fieldName: 'Subtitle', fieldType: 'Short text' },
      { id: 'description', fieldName: 'Description', fieldType: 'Long text' },
      { id: 'image', fieldName: 'Image', fieldType: 'Media' },
      {
        id: 'studioImageCustom',
        fieldName: 'Studio Image Custom',
        fieldType: 'Reference',
      },
      {
        id: 'bynderImage',
        fieldName: 'Bynder Image',
        fieldType: 'JSON object',
      },
      {
        id: 'videoRecordedDate',
        fieldName: 'Video Recorded Date',
        fieldType: 'Date & time',
      },
      { id: 'file', fieldName: 'File', fieldType: 'Reference' },
      { id: 'externalLink', fieldName: 'External link', fieldType: 'Short text' },
      { id: 'mediaType', fieldName: 'Media type', fieldType: 'Short text' },
      { id: 'variant', fieldName: 'Variant', fieldType: 'Short text' },
      { id: 'ninetailed', fieldName: 'Ninetailed', fieldType: 'References, many' },
    ],
  },
  {
    id: 'component-resource-detail-hero',
    title: "Component: Resource detail hero (Don't enter NRF uncaffeinated.)",
    fieldMappings: [{ fieldId: 'headline' }, { fieldId: 'ctaLink' }],
    fieldOptions: [
      { id: 'eyebrow', fieldName: 'Eyebrow', fieldType: 'Short text' },
      { id: 'headline', fieldName: 'Headline', fieldType: 'Short text' },
      { id: 'body', fieldName: 'Body', fieldType: 'Long text' },
      { id: 'ctaLabel', fieldName: 'CTA label', fieldType: 'Short text' },
      { id: 'ctaLink', fieldName: 'CTA link', fieldType: 'Short text' },
      { id: 'backgroundImage', fieldName: 'Background image', fieldType: 'Media' },
    ],
  },
];

export const mockExcludeSelection: EditModalContent = {
  selectedText: 'Sample selected content',
  isOpen: true,
  currentLocations: [
    {
      id: 'mock-summary',
      contentTypeId: 'sampleContentType',
      contentTypeName: 'Sample content type',
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
      contentTypeName: 'Sample content type',
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
  newLocations: placeholderAssignNewLocations,
};
