import ConfigScreen from './ConfigScreen';
import { render, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
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

  it('hides ExO permission rows in a classic space', async () => {
    mockCma.componentType.getMany.mockResolvedValue({ total: 0, items: [] });
    mockCma.contentType.getMany.mockResolvedValue({ total: 3, items: [] });

    const { queryByText, getByText } = render(<ConfigScreen />);
    await waitFor(() => expect(mockSdk.app.setReady).toHaveBeenCalled());

    // Classic entities still render...
    expect(getByText('Entries')).toBeInTheDocument();
    // ...ExO rows do not.
    await waitFor(() => {
      expect(queryByText('Component types')).not.toBeInTheDocument();
      expect(queryByText('Experiences')).not.toBeInTheDocument();
    });
  });

  it('shows ExO permission rows in an ExO-enabled space', async () => {
    mockCma.componentType.getMany.mockResolvedValue({ total: 2, items: [] });
    mockCma.contentType.getMany.mockResolvedValue({ total: 5, items: [] });

    const { findByText } = render(<ConfigScreen />);
    await waitFor(() => expect(mockSdk.app.setReady).toHaveBeenCalled());

    expect(await findByText('Component types')).toBeInTheDocument();
    expect(await findByText('Experiences')).toBeInTheDocument();
    expect(await findByText('Data assemblies')).toBeInTheDocument();
    expect(await findByText('Fragments')).toBeInTheDocument();
    expect(await findByText('Templates')).toBeInTheDocument();
  });
});
