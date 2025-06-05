import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect, afterEach } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { createMockCma, getManyContentTypes } from '../../mocks/mockCma';
import {
  condoAContentType,
  condoBContentType,
  condoCContentType,
} from '../../mocks/mockContentTypes';

// Correctly mock Forma 36 NavList component
// Mock useSDK to return mockSdk
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page Navigation', () => {
  beforeEach(() => {
    mockSdk.cma = createMockCma();
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(
        getManyContentTypes([condoAContentType, condoBContentType, condoCContentType])
      );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with all content types', async () => {
    render(<Page />);
    const nav = await screen.findAllByTestId('content-types-nav');
    expect(nav).toBeTruthy();
    expect(screen.getByText('Condo A')).toBeTruthy();
    expect(screen.getByText('Condo B')).toBeTruthy();
    expect(screen.getByText('Condo C')).toBeTruthy();
  });

  it('sorts content types alphabetically in the sidebar', async () => {
    render(<Page />);
    const items = await screen.findAllByTestId('content-type-nav-item');
    const texts = items.map((el) => el.textContent);
    expect(texts).toEqual(['Condo A', 'Condo B', 'Condo C']);
  });

  it('changes title when selecting a different content type', async () => {
    render(<Page />);
    expect(await screen.findByText('Bulk edit Condo A')).toBeTruthy();
    fireEvent.click(screen.getByText('Condo B'));
    expect(await screen.findByText('Bulk edit Condo B')).toBeTruthy();
  });
});
