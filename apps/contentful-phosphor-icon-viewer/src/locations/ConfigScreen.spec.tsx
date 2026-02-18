import ConfigScreen from './ConfigScreen';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi, beforeEach } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('ConfigScreen component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue(null);
  });

  const renderWithEffects = async () => {
    render(<ConfigScreen />);
    await waitFor(() => expect(mockSdk.app.onConfigure).toHaveBeenCalled());
    await waitFor(() => expect(mockSdk.app.setReady).toHaveBeenCalled());
  };

  it('renders configuration heading', async () => {
    await renderWithEffects();

    expect(screen.getByText('Phosphor Icons Configuration')).toBeInTheDocument();
  });

  it('renders all weight checkboxes', async () => {
    await renderWithEffects();

    expect(screen.getByText('Thin')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
  });

  it('has regular weight checked by default', async () => {
    await renderWithEffects();

    const regularCheckbox = screen.getByRole('checkbox', { name: /regular/i });
    expect(regularCheckbox).toBeChecked();
  });

  it('can toggle weight checkboxes', async () => {
    await renderWithEffects();

    const boldCheckbox = screen.getByRole('checkbox', { name: /bold/i });
    expect(boldCheckbox).not.toBeChecked();

    fireEvent.click(boldCheckbox);
    expect(boldCheckbox).toBeChecked();

    fireEvent.click(boldCheckbox);
    expect(boldCheckbox).not.toBeChecked();
  });

  it('loads existing parameters on mount', async () => {
    mockSdk.app.getParameters.mockResolvedValue({
      enabledWeights: ['thin', 'bold'],
    });

    await renderWithEffects();

    await waitFor(() => {
      const thinCheckbox = screen.getByRole('checkbox', { name: /thin/i });
      const boldCheckbox = screen.getByRole('checkbox', { name: /bold/i });
      const regularCheckbox = screen.getByRole('checkbox', {
        name: /regular/i,
      });

      expect(thinCheckbox).toBeChecked();
      expect(boldCheckbox).toBeChecked();
      expect(regularCheckbox).not.toBeChecked();
    });
  });

  it('calls setReady on mount', async () => {
    await renderWithEffects();
  });

  it('registers onConfigure callback', async () => {
    await renderWithEffects();

    expect(mockSdk.app.onConfigure).toHaveBeenCalled();
  });

  it('shows warning when no weights selected', async () => {
    await renderWithEffects();

    // Uncheck the default "regular" weight
    const regularCheckbox = screen.getByRole('checkbox', { name: /regular/i });
    fireEvent.click(regularCheckbox);

    expect(screen.getByText('Please select at least one icon weight.')).toBeInTheDocument();
  });

  it('returns false from onConfigure when no weights selected', async () => {
    await renderWithEffects();

    // Uncheck the default "regular" weight
    const regularCheckbox = screen.getByRole('checkbox', { name: /regular/i });
    fireEvent.click(regularCheckbox);

    // Wait for state update, then get the latest callback
    await waitFor(() => {
      expect(regularCheckbox).not.toBeChecked();
    });

    // Get the most recent onConfigure callback (it's re-registered on state changes)
    const calls = mockSdk.app.onConfigure.mock.calls;
    const latestCallback = calls[calls.length - 1][0];
    const result = await latestCallback();

    expect(result).toBe(false);
    expect(mockSdk.notifier.error).toHaveBeenCalledWith('Please select at least one icon weight.');
  });

  it('returns correct parameters from onConfigure', async () => {
    await renderWithEffects();

    // Check bold weight in addition to regular
    const boldCheckbox = screen.getByRole('checkbox', { name: /bold/i });
    fireEvent.click(boldCheckbox);

    // Wait for state update
    await waitFor(() => {
      expect(boldCheckbox).toBeChecked();
    });

    // Get the most recent onConfigure callback
    const calls = mockSdk.app.onConfigure.mock.calls;
    const latestCallback = calls[calls.length - 1][0];
    const result = await latestCallback();

    expect(result.parameters).toEqual({
      enabledWeights: JSON.stringify(['regular', 'bold']),
    });
  });
});
