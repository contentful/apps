import React from 'react';
import { configure, render, cleanup } from '@testing-library/react';
import FieldSelector, { Props } from './FieldSelector';
import { typeforms } from '../__mocks__/typeforms';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

const defaultProps: Props = {
  contentTypes: [
    {
      sys: { id: 'ct1' },
      name: 'CT1',
      fields: [
        { id: 'x', name: 'X', type: 'Symbol' },
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
  ],
  compatibleFields: {
    ct1: [{ id: 'x', name: 'X', type: 'Symbol' }],
    ct2: [],
  },
  selectedFields: {},
  onSelectedFieldsChange: vi.fn(),
};

describe('FieldSelector', () => {
  beforeEach(() => {
    window.fetch = vi.fn(() => ({
      json: () => typeforms,
    })) as any;
  });
  afterEach(cleanup);

  it('should render successfully with no preselected fields', async () => {
    const component = render(<FieldSelector {...defaultProps} />);
    expect(component.container).toMatchSnapshot();
  });

  it('should render successfully with preselected fields', async () => {
    const props = {
      ...defaultProps,
      selectedFields: { ct1: ['x'] },
    };
    const component = render(<FieldSelector {...props} />);
    expect(component.container).toMatchSnapshot();
  });
});
