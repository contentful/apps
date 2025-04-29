import { Sidebar } from './Sidebar';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { locations } from '@contentful/app-sdk';

const syncContentStub = vi.fn().mockResolvedValue({ success: true });

// Mock the module dependencies
vi.mock('../utils/klaviyo-api-service', () => {
  return {
    FieldData: class FieldData {
      id: string = '';
      name: string = '';
      type: string = '';
      value: any = null;
      isAsset: boolean = false;
      constructor(props: any) {
        Object.assign(this, props);
      }
    },
    SyncContent: class {
      syncContent = syncContentStub;
    },
  };
});

vi.mock('../utils/persistence-service', () => {
  return {
    getSyncData: vi
      .fn()
      .mockResolvedValue([
        { id: 'title', name: 'Title', type: 'Symbol', value: 'Test Title', isAsset: false },
      ]),
    updateSyncData: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../utils/field-utilities', () => {
  return {
    getFieldDetails: vi.fn().mockImplementation((fieldId) => ({
      id: fieldId,
      name: fieldId === 'title' ? 'Title' : 'Content',
      type: 'Symbol',
      value: fieldId === 'title' ? 'Test Title' : 'Test Content',
      isAsset: false,
    })),
  };
});

// Mock the React Apps Toolkit
vi.mock('@contentful/react-apps-toolkit', () => {
  return {
    useSDK: () => mockSdk,
    useCMA: () => ({}),
  };
});

// Create mock SDK
const mockSdk = {
  ids: {
    entry: 'entry123',
    contentType: 'blogPost',
  },
  location: {
    is: vi.fn((loc) => loc === locations.LOCATION_ENTRY_SIDEBAR),
  },
  contentType: {
    sys: {
      id: 'blogPost',
    },
  },
  entry: {
    fields: {
      title: {
        getValue: vi.fn().mockReturnValue('Test Title'),
      },
      content: {
        getValue: vi.fn().mockReturnValue('Test Content'),
      },
    },
    getSys: vi.fn().mockReturnValue({
      id: 'entry123',
    }),
    onSysChanged: vi.fn().mockReturnValue(() => {}),
  },
  space: {
    getContentType: vi.fn().mockResolvedValue({
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol' },
        { id: 'content', name: 'Content', type: 'Text' },
      ],
    }),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
  },
  parameters: {
    installation: {
      klaviyoApiKey: 'test-api-key',
    },
  },
  dialogs: {
    openCurrentApp: vi.fn().mockResolvedValue([{ id: 'content', isAsset: false }]),
  },
  app: {
    setReady: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({ mappings: [] }),
    setParameters: vi.fn().mockResolvedValue(undefined),
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  locales: {
    default: 'en-US',
  },
};

// Test suite
describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.location.is.mockImplementation((loc) => loc === locations.LOCATION_ENTRY_SIDEBAR);
  });

  it('renders the sidebar with mapping information', async () => {
    render(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByText('Configure Field Mappings')).toBeInTheDocument();
    });

    expect(screen.getByText('Sync to Klaviyo')).toBeInTheDocument();
  });

  it('allows adding a new field mapping', async () => {
    const { updateSyncData } = await import('../utils/persistence-service');

    render(<Sidebar />);

    const addButton = await screen.findByText('Configure Field Mappings');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(updateSyncData).toHaveBeenCalled();
    });
  });

  it('allows syncing content to Klaviyo', async () => {
    render(<Sidebar />);

    const syncButton = await screen.findByText('Sync to Klaviyo');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(syncContentStub).toHaveBeenCalled();
    });
  });
});
