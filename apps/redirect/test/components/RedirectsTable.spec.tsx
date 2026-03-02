import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockSdk } from '../mocks';
import { createMockRedirectForPage } from '../utils/testUtils';
import { RedirectsTable } from '../../src/components/RedirectsTable';
import { EntryProps } from 'contentful-management';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('../../src/hooks/useRedirects', () => ({
  useRedirects: () => ({
    redirects: [createMockRedirectForPage(0) as EntryProps],
    total: 1,
    isFetchingRedirects: false,
    fetchingRedirectsError: null,
    refetchRedirects: vi.fn(),
    fetchedAt: new Date(),
  }),
}));

describe('RedirectsTable component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockSdk as any).navigator = {
      ...(mockSdk as any).navigator,
      openEntry: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('calls sdk.navigator.openEntry with destination entry ID when clicking destination link', async () => {
    render(<RedirectsTable />);

    const destinationLink = await screen.findByText('Field to title 0');
    fireEvent.click(destinationLink);

    expect((mockSdk as any).navigator.openEntry).toHaveBeenCalledWith('test-id-0');
  });
});
