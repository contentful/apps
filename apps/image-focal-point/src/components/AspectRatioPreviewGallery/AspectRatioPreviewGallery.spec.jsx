import React from 'react';
import { render } from '@testing-library/react';

import mockProps from '../../test/mockProps';
import { AspectRatioPreviewGallery } from './AspectRatioPreviewGallery';

const props = {
  file: mockProps.file,
  focalPoint: mockProps.focalPoint,
};

describe('AspectRatioPreviewGallery', () => {
  it('renders focal point previews for common aspect ratios', () => {
    const { getByText } = render(<AspectRatioPreviewGallery {...props} />);

    expect(getByText('16:9')).toBeDefined();
    expect(getByText('4:3')).toBeDefined();
    expect(getByText('1:1')).toBeDefined();
  });

  it('does not render until an image and focal point are available', () => {
    const { container } = render(<AspectRatioPreviewGallery file={mockProps.file} />);

    expect(container.firstChild).toBeNull();
  });
});
