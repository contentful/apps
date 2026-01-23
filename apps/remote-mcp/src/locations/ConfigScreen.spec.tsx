import ConfigScreen from './ConfigScreen';
import { render, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.getCurrentState.mockResolvedValue({});
  });

  it('renders the main heading', async () => {
    const { getByText } = render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    expect(getByText('Set up the Contentful remote MCP Server (Beta)')).toBeInTheDocument();
  });

  it('renders all main sections', async () => {
    const { getByText } = render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    // Check for FormHeader content
    expect(getByText('Set up the Contentful remote MCP Server (Beta)')).toBeInTheDocument();

    // Check for Setup section
    expect(getByText('Set up instructions')).toBeInTheDocument();

    // Check for PermissionsSection - at least one permission category
    expect(getByText('Content lifecycle actions')).toBeInTheDocument();
  });
});
