export const mockContentTypes = [
  {
    sys: { id: 'ct1' },
    name: 'ct1',
    fields: [
      { id: 'f1', name: 'f1', type: 'Symbol' },
      { id: 'f2', name: 'f2', type: 'Array', items: { type: 'Symbol' } },
      { id: 'f3', name: 'f3', type: 'Array', items: { type: 'Link' } },
      { id: 'f4', name: 'f4', type: 'Link' },
    ],
  },
  {
    sys: { id: 'ct2' },
    name: 'ct2',
    fields: [
      { id: 'f5', name: 'f5', type: 'Symbol' },
      { id: 'f6', name: 'f6', type: 'Array', items: { type: 'Symbol' } },
    ],
  },
];
