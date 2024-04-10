import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PreviewPathInfoNote } from './PreviewPathInfoNote';
import { copies } from '@constants/copies';
import { mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

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
