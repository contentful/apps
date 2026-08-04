import ConfigScreen from './ConfigScreen';
import { render, waitFor } from '@testing-library/react';
import { mockSdk } from '../../test/mocks';
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

    expect(getByText('Set up the Contentful remote MCP Server')).toBeInTheDocument();
  });

  it('renders all main sections', async () => {
    const { getByText } = render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    // Check for FormHeader content
    expect(getByText('Set up the Contentful remote MCP Server')).toBeInTheDocument();

    // Check for Setup section
    expect(getByText('Set up instructions')).toBeInTheDocument();

    // Check for PermissionsSection - at least one permission category
    expect(getByText('Content lifecycle actions')).toBeInTheDocument();
  });

  it('renders the Experience orchestration section', async () => {
    const { getByText } = render(<ConfigScreen />);
    await waitFor(() => expect(mockSdk.app.setReady).toHaveBeenCalled());

    expect(getByText('Experience orchestration actions')).toBeInTheDocument();
  });

  it('always renders the ExO permission rows (detection is not possible from within an app)', async () => {
    const { findByText } = render(<ConfigScreen />);
    await waitFor(() => expect(mockSdk.app.setReady).toHaveBeenCalled());

    expect(await findByText('Component types')).toBeInTheDocument();
    expect(await findByText('Experiences')).toBeInTheDocument();
    expect(await findByText('Data assemblies')).toBeInTheDocument();
    expect(await findByText('Fragments')).toBeInTheDocument();
    expect(await findByText('Templates')).toBeInTheDocument();
  });

  it('does not render the migration section', async () => {
    const { queryByText } = render(<ConfigScreen />);
    await waitFor(() => expect(mockSdk.app.setReady).toHaveBeenCalled());

    expect(queryByText('Migration permissions')).not.toBeInTheDocument();
  });
});
