import Sidebar from '../../src/locations/Sidebar';
import { cleanup, fireEvent, render, waitFor, screen } from '@testing-library/react';
import { mockSdk } from '../mocks';
import { expectedFields } from '../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

const mockGetEntryConnectedFields = vi.fn();
vi.mock('../../src/utils/ConfigEntryService', () => ({
  default: vi.fn().mockImplementation(() => ({
    getEntryConnectedFields: mockGetEntryConnectedFields,
  })),
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('Sync button opens dialog', async () => {
    mockSdk.cma.asset.get.mockResolvedValue({
      fields: {
        file: {
          'en-US': {
            url: 'https://example.com/image.jpg',
            contentType: 'image/jpeg',
            details: {
              image: { width: 100, height: 100 },
            },
          },
        },
      },
    });
    const { getByText } = render(<Sidebar />);

    const syncButton = getByText('Sync entry fields to Hubspot');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    });
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith({
      title: 'Sync entry fields to Hubspot',
      parameters: {
        entryTitle: 'title value',
        entryId: 'test-entry-id',
        fields: expectedFields,
      },
    });
  });

  it('Page button opens page', () => {
    const { getByText } = render(<Sidebar />);

    const pageButton = getByText('View all connected entries');
    fireEvent.click(pageButton);

    expect(mockSdk.navigator.openCurrentAppPage).toHaveBeenCalledTimes(1);
  });

  it('displays warning when connected fields have errors', async () => {
    mockGetEntryConnectedFields.mockResolvedValue([
      {
        fieldId: 'title',
        locale: 'en-US',
        moduleName: 'test-module',
        updatedAt: '2024-01-01T00:00:00Z',
        error: { status: 400, message: 'Bad Request' },
      },
    ]);

    render(<Sidebar />);
    expect(await screen.findByText('Unable to sync content', { exact: false })).toBeInTheDocument();
  });

  it('displays synced fields count message', async () => {
    mockGetEntryConnectedFields.mockResolvedValue([
      {
        fieldId: 'title',
        locale: 'en-US',
        moduleName: 'test-module',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        fieldId: 'description',
        locale: 'en-US',
        moduleName: 'test-module',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);

    render(<Sidebar />);

    expect(await screen.findByText('2 fields synced', { exact: false })).toBeInTheDocument();
  });

  it('displays error when dialog returns true', async () => {
    mockSdk.cma.asset.get.mockResolvedValue({
      fields: {
        file: {
          'en-US': {
            url: 'https://example.com/image.jpg',
            contentType: 'image/jpeg',
            details: {
              image: { width: 100, height: 100 },
            },
          },
        },
      },
    });
    mockSdk.dialogs.openCurrentApp.mockResolvedValue(true);
    const { getByText } = render(<Sidebar />);

    const syncButton = getByText('Sync entry fields to Hubspot');
    fireEvent.click(syncButton);

    expect(
      await screen.findByText(
        'There is an error with your Hubspot private app access token, and entry fields did not sync.',
        { exact: false }
      )
    ).toBeInTheDocument();
  });
});
