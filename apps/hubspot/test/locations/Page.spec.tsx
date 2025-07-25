import { render, waitFor, screen, cleanup, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';
import Page from '../../src/locations/Page';

const mockNavigator = { openEntry: vi.fn() };
const mockSdk = {
  cmaAdapter: {},
  ids: { environment: 'env', space: 'space' },
  locales: { default: 'en-US' },
  navigator: mockNavigator,
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
  },
};

const mockCma = {
  entry: {
    get: vi.fn(),
    getMany: vi.fn(),
  },
  contentType: {
    get: vi.fn(),
  },
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

const mockGetConnectedFields = vi.fn();
const mockGetEntryConnectedFields = vi.fn();
const mockUpdateEntryConnectedFields = vi.fn();
const mockRemoveEntryConnectedFields = vi.fn();

vi.mock('../../src/utils/ConfigEntryService', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getConnectedFields: mockGetConnectedFields,
      getEntryConnectedFields: mockGetEntryConnectedFields,
      updateEntryConnectedFields: mockUpdateEntryConnectedFields,
      removeEntryConnectedFields: mockRemoveEntryConnectedFields,
    })),
  };
});

describe('Page Location', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state initially', () => {
    mockGetConnectedFields.mockReturnValue(new Promise(() => {}));

    render(<Page />);

    expect(screen.getByText(/Loading.../i)).toBeTruthy();
  });

  it('renders empty state if no connected entries', async () => {
    mockGetConnectedFields.mockResolvedValue({});

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Hubspot')).toBeTruthy();
      expect(
        screen.getByText(
          'No connected content. Sync entry fields from the entry page sidebar to get started.'
        )
      ).toBeTruthy();
      expect(
        screen.queryByText(
          /View the details of your synced entry fields. Click Manage fields to connect or disconnect content./i
        )
      ).toBeNull();
    });
  });

  it('renders error banner if there is an error', async () => {
    mockGetConnectedFields.mockImplementation(() => {
      throw new Error('fail');
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('The app cannot load content.')).toBeTruthy();
      expect(screen.getByRole('link', { name: /app configuration/i })).toBeTruthy();
    });
  });

  it('renders connected entries table if entries exist', async () => {
    mockGetConnectedFields.mockResolvedValue({
      'entry-1': [
        { fieldId: 'title', moduleName: 'mod1', updatedAt: '2024-05-01T10:00:00Z' },
        { fieldId: 'description', moduleName: 'mod2', updatedAt: '2024-05-01T10:00:00Z' },
      ],
      'entry-2': [
        {
          fieldId: 'title',
          moduleName: 'mod1',
          updatedAt: '2024-05-01T10:00:00Z',
        },
      ],
    });
    mockCma.entry.getMany = vi.fn().mockResolvedValue({
      items: [
        {
          sys: {
            id: 'entry-1',
            contentType: { sys: { id: 'fruits' } },
            updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            publishedAt: new Date().toISOString(),
          },
          fields: {
            title: { 'en-US': 'Banana' },
          },
        },
        {
          sys: {
            id: 'entry-2',
            contentType: { sys: { id: 'animals' } },
            updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
            publishedAt: undefined,
          },
          fields: { title: { 'en-US': 'Dog' } },
        },
      ],
    });

    mockCma.contentType.get = vi.fn().mockImplementation(({ contentTypeId }) => {
      if (contentTypeId === 'fruits') {
        return Promise.resolve({
          displayField: 'title',
          name: 'Fruits',
          sys: { id: 'fruits' },
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'description', name: 'Description', type: 'Text' },
          ],
        });
      }
      if (contentTypeId === 'animals') {
        return Promise.resolve({
          name: 'Animals',
          sys: { id: 'animals' },
          displayField: 'title',
          fields: [{ id: 'title', name: 'Title', type: 'Text' }],
        });
      }
      return Promise.resolve({ displayField: 'title', fields: [] });
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Banana')).toBeTruthy();
      expect(screen.getByText('Dog')).toBeTruthy();
      expect(screen.getByText('Fruits')).toBeTruthy();
      expect(screen.getByText('Animals')).toBeTruthy();
      expect(screen.getByText('Published')).toBeTruthy();
      expect(screen.getByText('Draft')).toBeTruthy();
      expect(screen.getAllByText('Manage fields').length).toBe(2);
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('1')).toBeTruthy();
    });
  });

  describe('Connected Fields Modal', () => {
    beforeEach(() => {
      mockGetConnectedFields.mockResolvedValue({
        'entry-id': [
          { fieldId: 'title', moduleName: 'mod1', updatedAt: '2024-05-01T10:00:00Z' },
          { fieldId: 'description', moduleName: 'mod2', updatedAt: '2024-05-01T10:00:00Z' },
          {
            fieldId: 'greeting',
            moduleName: 'mod3',
            updatedAt: '2024-05-01T10:00:00Z',
            locale: 'es-AR',
          },
          {
            fieldId: 'greeting',
            moduleName: 'mod4',
            updatedAt: '2024-05-01T10:00:00Z',
            locale: 'en-US',
          },
        ],
      });
      mockCma.entry.getMany = vi.fn().mockResolvedValue({
        items: [
          {
            sys: {
              id: 'entry-id',
              contentType: { sys: { id: 'fruits' } },
              updatedAt: new Date().toISOString(),
              publishedAt: new Date().toISOString(),
            },
            fields: {
              title: { 'en-US': 'Banana' },
              description: { 'en-US': 'Description value' },
              greeting: { 'en-US': 'Hello', 'es-AR': 'Hola' },
            },
          },
        ],
      });
      mockCma.contentType.get = vi.fn().mockResolvedValue({
        displayField: 'title',
        name: 'Fruits',
        sys: { id: 'fruits' },
        fields: [
          { id: 'title', name: 'Title', type: 'Symbol' },
          { id: 'description', name: 'Description', type: 'Text' },
          { id: 'greeting', name: 'Greeting', type: 'Text' },
        ],
      });
    });

    it('displays entry name, connected fields name and type, and View entry button', async () => {
      render(<Page />);
      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await screen.findByRole('dialog');
      expect(screen.getByTestId('modal-entry-title')).toBeTruthy();
      expect(screen.getByText((content) => content.startsWith('Select all fields'))).toBeTruthy();
      expect(screen.getByText('View entry')).toBeTruthy();
      expect(screen.getByText('Title')).toBeTruthy();
      expect(screen.getByText('(Short text)')).toBeTruthy();
      expect(screen.getByText('Description')).toBeTruthy();
      expect(screen.getByText('Greeting (en-US)')).toBeTruthy();
      expect(screen.getByText('Greeting (es-AR)')).toBeTruthy();
    });

    it('selects/deselects all fields with header checkbox', async () => {
      render(<Page />);
      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await screen.findByRole('dialog');
      const selectAll = screen.getByTestId('select-all-fields');
      // Select all
      fireEvent.click(selectAll);
      expect((screen.getByLabelText('Description') as HTMLInputElement).checked).toBe(true);
      // Deselect all
      fireEvent.click(selectAll);
      expect((screen.getByLabelText('Description') as HTMLInputElement).checked).toBe(false);
    });

    it('toggles individual field selection', async () => {
      render(<Page />);
      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await screen.findByRole('dialog');
      const descriptionCheckbox = screen.getByLabelText('Description') as HTMLInputElement;
      expect(descriptionCheckbox.checked).toBe(false);
      fireEvent.click(descriptionCheckbox);
      expect(descriptionCheckbox.checked).toBe(true);
      fireEvent.click(descriptionCheckbox);
      expect(descriptionCheckbox.checked).toBe(false);
    });

    it('calls navigation when View entry is clicked', async () => {
      render(<Page />);
      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await screen.findByRole('dialog');
      screen.getByRole('button', { name: /View entry/i }).click();
      expect(mockSdk.navigator.openEntry).toHaveBeenCalledWith('entry-id');
    });

    it('enables disconnect button when fields are selected', async () => {
      render(<Page />);
      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await screen.findByRole('dialog');

      // Initially disabled
      expect(screen.queryByRole('button', { name: /Disconnect/i })).toBeDisabled();

      // Select a field
      const titleCheckbox = screen.getByLabelText('Title') as HTMLInputElement;
      fireEvent.click(titleCheckbox);

      // Disconnect button should be enabled
      expect(screen.getByRole('button', { name: /Disconnect/i })).toBeEnabled();
      expect(screen.getByText('1 selected')).toBeTruthy();
    });

    it('shows correct count when multiple fields are selected', async () => {
      render(<Page />);
      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await screen.findByRole('dialog');

      // Select multiple fields
      const titleCheckbox = screen.getByLabelText('Title') as HTMLInputElement;
      const descriptionCheckbox = screen.getByLabelText('Description') as HTMLInputElement;
      fireEvent.click(titleCheckbox);
      fireEvent.click(descriptionCheckbox);

      expect(screen.getByText('2 selected')).toBeTruthy();
    });

    it('disconnects selected fields successfully', async () => {
      mockGetEntryConnectedFields.mockResolvedValue([
        { fieldId: 'title', moduleName: 'mod1', updatedAt: '2024-05-01T10:00:00Z' },
        { fieldId: 'description', moduleName: 'mod2', updatedAt: '2024-05-01T10:00:00Z' },
        {
          fieldId: 'greeting',
          moduleName: 'mod3',
          updatedAt: '2024-05-01T10:00:00Z',
          locale: 'en-US',
        },
        {
          fieldId: 'greeting',
          moduleName: 'mod4',
          updatedAt: '2024-05-01T10:00:00Z',
          locale: 'es-AR',
        },
      ]);
      mockUpdateEntryConnectedFields.mockResolvedValue({});
      mockGetConnectedFields.mockResolvedValueOnce({
        'entry-id': [
          { fieldId: 'title', moduleName: 'mod1', updatedAt: '2024-05-01T10:00:00Z' },
          { fieldId: 'description', moduleName: 'mod2', updatedAt: '2024-05-01T10:00:00Z' },
          {
            fieldId: 'greeting',
            moduleName: 'mod3',
            updatedAt: '2024-05-01T10:00:00Z',
            locale: 'en-US',
          },
          {
            fieldId: 'greeting',
            moduleName: 'mod4',
            updatedAt: '2024-05-01T10:00:00Z',
            locale: 'es-AR',
          },
        ],
      });
      mockGetConnectedFields.mockResolvedValue({
        'entry-id': [
          { fieldId: 'description', moduleName: 'mod2', updatedAt: '2024-05-01T10:00:00Z' },
          {
            fieldId: 'greeting',
            moduleName: 'mod4',
            updatedAt: '2024-05-01T10:00:00Z',
            locale: 'es-AR',
          },
        ],
      });

      render(<Page />);
      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await waitFor(() => screen.findByRole('dialog'));

      // Select title field
      const titleCheckbox = screen.getByLabelText('Title') as HTMLInputElement;
      fireEvent.click(titleCheckbox);

      const greetingCheckbox = screen.getByLabelText('Greeting (en-US)') as HTMLInputElement;
      fireEvent.click(greetingCheckbox);

      // Click disconnect
      const disconnectBtn = screen.getByRole('button', { name: /Disconnect/i });
      fireEvent.click(disconnectBtn);

      await waitFor(() => {
        expect(mockGetEntryConnectedFields).toHaveBeenCalledWith('entry-id');
        expect(mockUpdateEntryConnectedFields).toHaveBeenCalledWith('entry-id', [
          { fieldId: 'description', moduleName: 'mod2', updatedAt: '2024-05-01T10:00:00Z' },
          {
            fieldId: 'greeting',
            moduleName: 'mod4',
            updatedAt: '2024-05-01T10:00:00Z',
            locale: 'es-AR',
          },
        ]);
        expect(mockSdk.notifier.success).toHaveBeenCalledWith(
          '2 fields disconnected successfully.'
        );
      });
    });

    it('removes entry from config and table when all fields are disconnected', async () => {
      mockGetEntryConnectedFields.mockResolvedValue([
        { fieldId: 'title', moduleName: 'mod1', updatedAt: '2024-05-01T10:00:00Z' },
        { fieldId: 'description', moduleName: 'mod2', updatedAt: '2024-05-01T10:00:00Z' },
      ]);
      mockRemoveEntryConnectedFields.mockResolvedValue({});
      mockGetConnectedFields.mockResolvedValueOnce({
        'entry-id': [
          { fieldId: 'title', moduleName: 'mod1', updatedAt: '2024-05-01T10:00:00Z' },
          { fieldId: 'description', moduleName: 'mod2', updatedAt: '2024-05-01T10:00:00Z' },
        ],
      });
      // After disconnect: entry is removed
      mockGetConnectedFields.mockResolvedValueOnce({});
      mockCma.entry.getMany = vi.fn().mockResolvedValue({
        items: [
          {
            sys: {
              id: 'entry-id',
              contentType: { sys: { id: 'Fruits' } },
              updatedAt: new Date().toISOString(),
              publishedAt: new Date().toISOString(),
            },
            fields: {
              title: { 'en-US': 'Banana' },
              description: { 'en-US': 'Description value' },
            },
          },
        ],
      });
      mockCma.contentType.get = vi.fn().mockResolvedValue({
        displayField: 'title',
        sys: { id: 'Fruits' },
        fields: [
          { id: 'title', name: 'Title', type: 'Text' },
          { id: 'description', name: 'Description', type: 'Text' },
        ],
      });

      render(<Page />);
      // Table should show the entry
      expect(await screen.findByText('Banana')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await screen.findByRole('dialog');

      const selectAllCheckbox = screen.getByTestId('select-all-fields') as HTMLInputElement;
      fireEvent.click(selectAllCheckbox);

      const disconnectBtn = screen.getByRole('button', { name: /Disconnect/i });
      fireEvent.click(disconnectBtn);

      // After disconnect, entry should be removed from config and table, and notification shown
      await waitFor(() => {
        expect(mockRemoveEntryConnectedFields).toHaveBeenCalledWith('entry-id');
        expect(mockSdk.notifier.success).toHaveBeenCalledWith(
          '2 fields disconnected successfully.'
        );
        expect(screen.queryByText('Banana')).not.toBeInTheDocument();
        expect(
          screen.getByText(
            'No connected content. Sync entry fields from the entry page sidebar to get started.'
          )
        ).toBeInTheDocument();
      });
    });
  });
});

describe('Error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConnectedFields.mockResolvedValue({
      'entry-1': [
        {
          fieldId: 'title',
          moduleName: 'mod1',
          updatedAt: '2024-05-01T10:00:00Z',
          error: { status: 400, message: 'Sync error' },
        },
      ],
    });
    mockCma.entry.getMany = vi.fn().mockResolvedValue({
      items: [
        {
          sys: {
            id: 'entry-1',
            contentType: { sys: { id: 'Fruits' } },
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
          },
          fields: {
            title: { 'en-US': 'Banana' },
          },
        },
      ],
    });
    mockCma.contentType.get = vi.fn().mockResolvedValue({
      displayField: 'title',
      sys: { id: 'Fruits' },
      fields: [{ id: 'title', name: 'Title', type: 'Text' }],
    });
  });

  it('shows error banner in the table if any config entry has an error', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Connection error')).toBeTruthy();
    });
  });

  it('shows error banner in the modal for a field with an error', async () => {
    render(<Page />);

    const btn = await screen.findByRole('button', { name: /Manage fields/i });
    fireEvent.click(btn);
    await screen.findByRole('dialog');

    expect(screen.getByText(/Unable to sync content/i)).toBeTruthy();
    expect(screen.getAllByText('Connection error')).toBeTruthy();
  });
});
