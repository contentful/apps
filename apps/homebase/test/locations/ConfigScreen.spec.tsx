import { cleanup, render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });
  it('renders content and creates HOMEBASE content type when missing', async () => {
    mockCma.contentType.get.mockRejectedValueOnce(new Error('not found'));
    mockCma.contentType.createWithId.mockResolvedValueOnce({ sys: { id: 'HOMEBASE' } });
    mockCma.contentType.publish.mockResolvedValueOnce({});
    mockCma.uiConfig.get.mockResolvedValueOnce({
      sys: { id: 'ui-config' },
      assetListViews: [],
      entryListViews: [],
      homeViews: [],
    });
    mockCma.uiConfig.update.mockResolvedValueOnce({});
    const { getByText } = render(<ConfigScreen />);

    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(getByText('Set up Homebase')).toBeInTheDocument();
    expect(mockCma.contentType.get).toHaveBeenCalledWith({ contentTypeId: 'HOMEBASE' });
    expect(mockCma.contentType.createWithId).toHaveBeenCalled();
    expect(mockCma.contentType.publish).toHaveBeenCalled();
    expect(mockCma.uiConfig.get).toHaveBeenCalled();
    expect(mockCma.uiConfig.update).toHaveBeenCalled();
  });

  it('does not create when HOMEBASE already exists', async () => {
    mockCma.contentType.get.mockResolvedValueOnce({ sys: { id: 'HOMEBASE' } });
    mockCma.uiConfig.get.mockResolvedValueOnce({
      sys: { id: 'ui-config' },
      assetListViews: [],
      entryListViews: [],
      homeViews: [],
    });
    mockCma.uiConfig.update.mockResolvedValueOnce({});
    const { getByText } = render(<ConfigScreen />);
    await mockSdk.app.onConfigure.mock.calls[0][0]();
    expect(getByText('Set up Homebase')).toBeInTheDocument();
    expect(mockCma.contentType.createWithId).not.toHaveBeenCalled();
    expect(mockCma.uiConfig.get).toHaveBeenCalled();
    expect(mockCma.uiConfig.update).toHaveBeenCalled();
  });

  it('handles UI Config update failure', async () => {
    mockCma.contentType.get.mockResolvedValueOnce({ sys: { id: 'HOMEBASE' } });
    mockCma.uiConfig.get.mockResolvedValueOnce({
      sys: { id: 'ui-config' },
      assetListViews: [],
      entryListViews: [],
      homeViews: [],
    });
    mockCma.uiConfig.update.mockRejectedValueOnce(new Error('UI Config update failed'));
    mockSdk.notifier.error = vi.fn();

    const { getByText } = render(<ConfigScreen />);

    await expect(mockSdk.app.onConfigure.mock.calls[0][0]()).rejects.toThrow(
      'UI Config update failed'
    );

    expect(getByText('Set up Homebase')).toBeInTheDocument();
    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'Failed to configure Home location. Please try again.'
    );
  });
});
