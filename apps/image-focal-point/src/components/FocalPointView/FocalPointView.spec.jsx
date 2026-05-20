import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import mockProps from '../../test/mockProps';
import { FocalPointView } from './FocalPointView';

const props = {
  file: mockProps.file,
  focalPoint: {
    x: 10,
    y: 30,
  },
  showFocalPointDialog: vi.fn(),
  resetFocalPoint: vi.fn(),
};

describe('FocalPointView', () => {
  it('should render the focal point field view', () => {
    const { container, getByText } = render(<FocalPointView {...props} />);

    expect(getByText('16:9')).toBeDefined();
    expect(getByText('4:3')).toBeDefined();
    expect(getByText('1:1')).toBeDefined();
    expect(container).toBeDefined();
  });
});
