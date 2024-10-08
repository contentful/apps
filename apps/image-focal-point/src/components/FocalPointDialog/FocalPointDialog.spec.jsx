import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import mockProps from '../../test/mockProps';
import { FocalPointDialog } from './FocalPointDialog';

const props = {
  file: mockProps.file,
  focalPoint: mockProps.focalPoint,
  onClose: vi.fn(),
  onSave: vi.fn(),
  sdk: mockProps.sdk,
};

describe('FocalPointDialog', () => {
  it('should render the focal point dialog', () => {
    const { container } = render(<FocalPointDialog {...props} />);
    expect(container).toBeDefined();
  });
});
