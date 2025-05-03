import React from 'react';
import ConfigScreen from './ConfigScreen';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { locations } from '@contentful/app-sdk';

// Mock the Contentful SDK
const mockSdk = {
  app: {
    onConfigure: vi.fn().mockReturnValue(true),
    getParameters: vi.fn().mockResolvedValue({
      publicKey: 'old-api-key',
      privateKey: 'old-private-key',
    }),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockReturnValue({
      EditorInterface: {
        sidebar: {
          position: 0,
        },
      },
    }),
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  parameters: {
    installation: {
      publicKey: 'existing-api-key',
      privateKey: 'existing-private-key',
    },
  },
  ids: {
    app: 'klaviyo-app',
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  location: {
    is: vi.fn((loc) => loc === locations.LOCATION_APP_CONFIG),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
  },
};

// Mock the CMA client
const mockCma = {
  app: {
    getAppDefinition: vi.fn().mockResolvedValue({
      sys: {
        id: 'app-definition-id',
      },
      parameters: {
        instanceParameters: {
          publicKey: 'api-key-from-cma',
        },
      },
    }),
  },
};

// Mock the React Apps Toolkit
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

// Mock Formik to bypass form issues in tests
vi.mock('formik', () => ({
  useFormik: vi.fn(() => ({
    values: {
      publicKey: 'existing-api-key',
      privateKey: 'existing-private-key',
    },
    errors: {},
    touched: {},
    isSubmitting: false,
    handleSubmit: vi.fn(),
    handleChange: vi.fn(),
    setValues: vi.fn(),
  })),
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the configuration form', async () => {
    render(<ConfigScreen />);

    // Check that the form renders with the title
    expect(screen.getByText('Set up Klaviyo App')).toBeInTheDocument();
    expect(screen.getByText('Configure access')).toBeInTheDocument();

    // Check that the app is marked as ready
    expect(mockSdk.app.setReady).toHaveBeenCalled();
  });

  it('loads parameters on mount', async () => {
    render(<ConfigScreen />);

    // Check that getParameters was called
    await waitFor(() => {
      expect(mockSdk.app.getParameters).toHaveBeenCalled();
    });
  });

  it('attaches onConfigure callback', async () => {
    render(<ConfigScreen />);

    // Check that onConfigure was set
    await waitFor(() => {
      expect(mockSdk.app.onConfigure).toHaveBeenCalled();
    });

    // Check that the callback is a function
    const onConfigureCallback = mockSdk.app.onConfigure.mock.calls[0][0];
    expect(typeof onConfigureCallback).toBe('function');

    // Call the callback and verify result
    const result = await onConfigureCallback();
    expect(result).toHaveProperty('parameters');
    expect(result).toHaveProperty('targetState');
  });
});
