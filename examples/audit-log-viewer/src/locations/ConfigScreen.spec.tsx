import ConfigScreen from './ConfigScreen';
import { render, screen } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    mockSdk.app.getParameters = vi.fn().mockResolvedValue(null);
    mockSdk.app.onConfigure = vi.fn();
    mockSdk.app.setReady = vi.fn();
  });

  it('renders the configuration screen', async () => {
    render(<ConfigScreen />);

    expect(await screen.findByText('Audit Log Viewer configuration')).toBeInTheDocument();
    expect(mockSdk.app.setReady).toHaveBeenCalled();
  });
});
