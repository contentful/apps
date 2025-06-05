import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { createMockCma, getManyContentTypes, getManyEntries } from '../../mocks/mockCma';
import {
  createMockEntry,
  condoAEntry1,
  condoAEntries,
  buildingWithBooleanEntry,
  buildingWithLocationEntry,
} from '../../mocks/mockEntries';
import {
  buildingWithBooleanContentType,
  buildingWithLocationContentType,
  condoAContentType,
  untitledContentType,
} from '../../mocks/mockContentTypes';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page Table Features', () => {
  beforeEach(() => {
    mockSdk.cma = createMockCma();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all fields in the table header', async () => {
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([condoAContentType]));
    mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue(getManyEntries([...condoAEntries]));
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValueOnce(condoAContentType);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Display name')).toBeInTheDocument();
      expect(screen.getByText('Display Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  it('renders entry data in the table cells', async () => {
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([condoAContentType]));
    mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue(getManyEntries([condoAEntry1]));
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValue(condoAContentType);

    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getAllByText('Building one')).toHaveLength(2);
    });
  });

  it('freezes the display name column when scrolling horizontally', async () => {
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([condoAContentType]));
    mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue(getManyEntries([condoAEntry1]));
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValue(condoAContentType);

    render(<Page />);

    const displayNameCells = await screen.findAllByTestId('display-name-cell');
    displayNameCells.forEach((cell) => {
      expect(
        cell.style.position === 'sticky' ||
          cell.className.includes('sticky') ||
          cell.className.includes('frozen')
      ).toBeTruthy();
    });
  });

  it('renders a Location field as Lat/Lon in the table', async () => {
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([buildingWithLocationContentType]));
    mockSdk.cma.entry.getMany = vi
      .fn()
      .mockResolvedValue(getManyEntries([buildingWithLocationEntry]));
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValue(buildingWithLocationContentType);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Lat: 39.73923, Lon: ...')).toBeInTheDocument();
    });
  });

  it('renders a Boolean field as true/false in the table', async () => {
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([buildingWithBooleanContentType]));
    mockSdk.cma.entry.getMany = vi
      .fn()
      .mockResolvedValue(getManyEntries([buildingWithBooleanEntry]));
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValue(buildingWithBooleanContentType);

    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('true')).toBeInTheDocument();
    });
  });

  it('shows Untitled if the display name is missing', async () => {
    const entryWithNoTitle = createMockEntry({ description: { 'en-US': 'Test Description' } });
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([untitledContentType]));
    mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue(getManyEntries([entryWithNoTitle]));
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValue(untitledContentType);

    render(<Page />);

    await waitFor(() => {
      // Should show Untitled in the first column
      expect(screen.getByText('Untitled')).toBeInTheDocument();
    });
  });
});
