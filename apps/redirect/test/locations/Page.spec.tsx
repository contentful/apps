import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import Page from '../../src/locations/Page';
import { createMockRedirect, createMockRedirectForPage } from '../utils/testUtils';
import { RedirectEntry } from '../../src/utils/types';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

let mockAllRedirects: RedirectEntry[] = [];

vi.mock('../../src/hooks/useRedirects', () => ({
  useRedirects: () => ({
    redirects: mockAllRedirects,
    allRedirects: mockAllRedirects,
    total: mockAllRedirects.length,
    isFetchingRedirects: false,
    fetchingRedirectsError: null,
    refetchRedirects: vi.fn(),
    fetchedAt: new Date(),
  }),
}));

const mockRedirectsCount = 5;
const defaultRedirects: RedirectEntry[] = Array.from({ length: mockRedirectsCount }, (_, i) =>
  createMockRedirectForPage(i)
);

describe('Page component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllRedirects = defaultRedirects;
    mockCma.entry.getMany.mockResolvedValue({ items: [], total: 0 });
    mockSdk.navigator = { openAppConfig: vi.fn() };
  });

  afterEach(() => {
    cleanup();
  });

  it('renders heading and configuration button', () => {
    render(<Page />);

    expect(screen.getByText('Redirects manager')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'App configuration' })).toBeInTheDocument();
  });

  it('calls sdk.navigator.openAppConfig when clicking the configuration button', () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'App configuration' }));

    expect(mockSdk.navigator.openAppConfig).toHaveBeenCalledTimes(1);
  });

  it('renders the redirects table', async () => {
    render(<Page />);

    await screen.findByTestId('redirects-table');
    expect(screen.getByText(`Field from title ${mockRedirectsCount - 1}`)).toBeInTheDocument();
    expect(screen.getByText(`Field to title ${mockRedirectsCount - 1}`)).toBeInTheDocument();
    expect(screen.getByText(`Redirect reason ${mockRedirectsCount - 1}`)).toBeInTheDocument();
    expect(screen.getByText(`Redirect type ${mockRedirectsCount - 1}`)).toBeInTheDocument();
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(0);
    expect(screen.getAllByText('Edit').length).toBeGreaterThanOrEqual(0);
  });

  describe('metrics', () => {
    it('renders all six metric labels', async () => {
      render(<Page />);

      await screen.findByText('Total Redirects');
      expect(screen.getByText('Active Redirects')).toBeInTheDocument();
      expect(screen.getByText('Inactive Redirects')).toBeInTheDocument();
      expect(screen.getByText("Vanity URL's")).toBeInTheDocument();
      expect(screen.getByText('301 Permanent')).toBeInTheDocument();
      expect(screen.getByText('302 Temporary')).toBeInTheDocument();
    });

    it('shows total redirect count from allRedirects', async () => {
      render(<Page />);

      await screen.findByText('Total Redirects');
      expect(screen.getAllByText(String(mockRedirectsCount)).length).toBeGreaterThanOrEqual(1);
    });

    it('counts 301 Permanent redirects correctly', async () => {
      mockAllRedirects = [
        createMockRedirect('r1', { type: 'Permanent (301)', active: true }),
        createMockRedirect('r2', { type: 'Permanent (301)', active: false }),
        createMockRedirect('r3', { type: 'Temporary (302)', active: true }),
      ];

      render(<Page />);

      await screen.findByText('301 Permanent');
      const permanentCount = screen.getAllByText('2');
      expect(permanentCount.length).toBeGreaterThanOrEqual(1);
    });

    it('shows vanity URL count from CMA response', async () => {
      mockCma.entry.getMany.mockResolvedValue({ items: new Array(3).fill({}), total: 3 });

      render(<Page />);

      await waitFor(() => {
        expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
