import { render, waitFor, screen, cleanup, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';
import Page from '../../src/locations/Page';

const mockNavigator = { openEntry: vi.fn() };
const mockSdk = {
  cmaAdapter: {},
  ids: { environment: 'env', space: 'space' },
  locales: { default: 'en-US' },
  navigator: mockNavigator,
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
vi.mock('../../src/utils/ConfigEntryService', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getConnectedFields: mockGetConnectedFields,
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

  it('renders empty table if no connected entries', async () => {
    mockGetConnectedFields.mockResolvedValue({});

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Hubspot')).toBeTruthy();
      expect(
        screen.getByText(
          /View the details of your synced entry fields. Click Manage fields to connect or disconnect content./i
        )
      ).toBeTruthy();
      expect(screen.getByText('No active Hubspot modules')).toBeTruthy();
      expect(
        screen.getByText('Once you have created modules, they will display here.')
      ).toBeTruthy();
      expect(screen.queryByRole('row', { name: /Manage fields/i })).toBeNull();
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
            contentType: { sys: { id: 'Fruits' } },
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
            contentType: { sys: { id: 'Animals' } },
            updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
            publishedAt: undefined,
          },
          fields: { title: { 'en-US': 'Dog' } },
        },
      ],
    });

    mockCma.contentType.get = vi.fn().mockImplementation(({ contentTypeId }) => {
      if (contentTypeId === 'Fruits') {
        return Promise.resolve({
          displayField: 'title',
          sys: { id: 'Fruits' },
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'description', name: 'Description', type: 'Text' },
          ],
        });
      }
      if (contentTypeId === 'Animals') {
        return Promise.resolve({
          sys: { id: 'Animals' },
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
              contentType: { sys: { id: 'Fruits' } },
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
        sys: { id: 'Fruits' },
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
      expect(screen.getByText('title')).toBeTruthy();
      expect(screen.getByText('(Short text)')).toBeTruthy();
      expect(screen.getByText('description')).toBeTruthy();
      expect(screen.getByText('greeting (en-US)')).toBeTruthy();
      expect(screen.getByText('greeting (es-AR)')).toBeTruthy();
    });

    it('selects/deselects all fields with header checkbox', async () => {
      render(<Page />);
      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await screen.findByRole('dialog');
      const selectAll = screen.getByTestId('select-all-fields');
      // Select all
      fireEvent.click(selectAll);
      expect((screen.getByLabelText('description') as HTMLInputElement).checked).toBe(true);
      // Deselect all
      fireEvent.click(selectAll);
      expect((screen.getByLabelText('description') as HTMLInputElement).checked).toBe(false);
    });

    it('toggles individual field selection', async () => {
      render(<Page />);
      const btn = await screen.findByRole('button', { name: /Manage fields/i });
      fireEvent.click(btn);
      await screen.findByRole('dialog');
      const descriptionCheckbox = screen.getByLabelText('description') as HTMLInputElement;
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
  });
});
