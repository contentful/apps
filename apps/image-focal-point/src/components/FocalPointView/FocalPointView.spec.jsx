import React from 'react';
import { render } from '@testing-library/react';

import { FocalPointView } from './FocalPointView';
import { vi } from 'vitest';

const props = {
  focalPoint: {
    x: 10,
    y: 30,
  },
  showFocalPointDialog: vi.fn(),
  resetFocalPoint: vi.fn(),
};

describe('FocalPointView', () => {
  it('should render the focal point field view', () => {
    const { container } = render(<FocalPointView {...props} />);
    expect(container).toMatchSnapshot();
  });
});
