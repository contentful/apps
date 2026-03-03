import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import { QueryProvider } from '../../src/providers/QueryProvider';
import Page from '../../src/locations/Page';
import { EntryProps } from 'contentful-management';
import { createMockRedirectForPage } from '../utils/testUtils';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('../../src/hooks/useRedirects', () => ({
  useRedirects: () => ({
    redirects: mockRedirects,
    total: mockRedirects.length,
    isFetchingRedirects: false,
    fetchingRedirectsError: null,
    refetchRedirects: vi.fn(),
    fetchedAt: new Date(),
  }),
}));

const mockRedirectsCount = 5;
const mockRedirects: EntryProps[] = Array.from({ length: mockRedirectsCount }, (_, index) =>
  createMockRedirectForPage(index)
);

describe('Page component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders heading, configuration button and redirects table', () => {
    render(
      <QueryProvider>
        <Page />
      </QueryProvider>
    );

    waitFor(() => {
      expect(screen.getByText('Redirects manager')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'App configuration' })).toBeInTheDocument();
    });
  });

  it('calls sdk.navigator.openAppConfig when clicking the configuration button', () => {
    const openAppConfig = vi.fn();
    (mockSdk as any).navigator = { openAppConfig };

    render(
      <QueryProvider>
        <Page />
      </QueryProvider>
    );

    const button = screen.getByRole('button', { name: 'App configuration' });
    fireEvent.click(button);

    expect(openAppConfig).toHaveBeenCalledTimes(1);
  });

  it('renders redirects table with data', async () => {
    render(
      <QueryProvider>
        <Page />
      </QueryProvider>
    );

    await screen.findByTestId('redirects-table');
    expect(screen.getByText(`Field from title ${mockRedirectsCount - 1}`)).toBeInTheDocument();
    expect(screen.getByText(`Field to title ${mockRedirectsCount - 1}`)).toBeInTheDocument();
    expect(screen.getByText(`Redirect reason ${mockRedirectsCount - 1}`)).toBeInTheDocument();
    expect(screen.getByText(`Redirect type ${mockRedirectsCount - 1}`)).toBeInTheDocument();
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(0);
    expect(screen.getAllByText('Edit').length).toBeGreaterThanOrEqual(0);
  });
});
