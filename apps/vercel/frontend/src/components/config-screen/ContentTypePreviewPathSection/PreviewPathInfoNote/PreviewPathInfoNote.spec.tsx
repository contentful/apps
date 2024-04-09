import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PreviewPathInfoNote } from './PreviewPathInfoNote';
import { copies } from '@constants/copies';

describe('PreviewPathInfoNote', () => {
  const { description, link } = copies.configPage.contentTypePreviewPathSection.infoNote;
  it('renders content', () => {
    render(<PreviewPathInfoNote />);
    const text = screen.getByText(description);
    const example = screen.getByTestId('info-box');
    const textLink = screen.getByText(link.copy);

    expect(text).toBeTruthy();
    expect(example).toBeTruthy();
    expect(textLink).toBeTruthy();
  });
});
