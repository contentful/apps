import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { createMockCma, getManyContentTypes } from '../../mocks/mockCma';
import { condoAContentType } from '../../mocks/mockContentTypes';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page Loading States', () => {
  beforeEach(() => {
    mockSdk.cma = createMockCma();
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([condoAContentType]));
  });

  it('shows loading spinner during initial content type fetch', async () => {
    render(<Page />);
    expect(screen.getAllByTitle('Loading…')[0]).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTitle('Loading…')).not.toBeInTheDocument();
    });
  });
});
