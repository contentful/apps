import Sidebar from '../../src/locations/Sidebar';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { mockSdk } from '../mocks';
import { expectedFields } from '../mocks/mockSdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
  });

  afterEach(cleanup);

  it('Sync button opens dialog', () => {
    const { getByText } = render(<Sidebar />);

    const syncButton = getByText('Sync entry fields to Hubspot');
    fireEvent.click(syncButton);

    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
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
