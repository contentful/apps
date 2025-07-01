import Sidebar from '../../src/locations/Sidebar';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';
import { expectedFields } from '../mocks/mockSdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
  });

  afterEach(cleanup);

  it('Sync button opens dialog', async () => {
    mockCma.asset.get.mockResolvedValue({
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
});
