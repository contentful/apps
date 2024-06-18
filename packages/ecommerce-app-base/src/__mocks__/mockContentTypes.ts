export const mockContentTypes = [
  {
    sys: { id: 'ct1' },
    name: 'CT1',
    fields: [
      { id: 'product_x', name: 'Product X', type: 'Symbol' },
      { id: 'y', name: 'Y', type: 'Object' },
    ],
  },
  {
    sys: { id: 'ct2' },
    name: 'CT2',
    fields: [
      { id: 'foo', name: 'FOO', type: 'Text' },
      { id: 'z', name: 'Z', type: 'Array', items: { type: 'Symbol' } },
    ],
  },
  {
    sys: { id: 'ct3' },
    name: 'CT3',
    fields: [
      { id: 'bar', name: 'BAR', type: 'Object' },
      { id: 'baz', name: 'BAZ', type: 'Object' },
      { id: 'product_d', name: 'Product D', type: 'Array', items: { type: 'Symbol' } },
      { id: 'product_a', name: 'Product A', type: 'Symbol' },
    ],
  },
];
