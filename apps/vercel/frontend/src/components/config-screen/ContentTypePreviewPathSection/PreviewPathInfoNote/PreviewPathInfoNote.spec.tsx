import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PreviewPathInfoNote } from './PreviewPathInfoNote';

describe('PreviewPathInfoNote', () => {
  it('renders content', () => {
    render(<PreviewPathInfoNote />);
    const text = screen.getByText('Preview path and token example:');
    const example = screen.getByTestId('info-box');
    const link = screen.getByText('View more examples');

    expect(text).toBeTruthy();
    expect(example).toBeTruthy();
    expect(link).toBeTruthy();
  });
});
