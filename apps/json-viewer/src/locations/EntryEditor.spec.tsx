import React from 'react';
import EntryEditor from './EntryEditor';
import { render, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { beforeEach, vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Entry component', () => {
  beforeEach(() => {
    mockCma.entry.get.mockClear();
    mockCma.entry.references.mockClear();
    mockSdk.parameters.installation.configOptions = {
      displayDataTypes: 'true',
      iconStyle: 'triangle',
      collapsed: 'true',
      theme: 'rjv-default',
      defaultIncludeDepth: '0',
    };
  });

  it('uses the configured default include depth when loading the entry', async () => {
    mockSdk.parameters.installation.configOptions = {
      displayDataTypes: 'true',
      iconStyle: 'triangle',
      collapsed: 'true',
      theme: 'rjv-default',
      defaultIncludeDepth: '3',
    };

    render(<EntryEditor />);

    await waitFor(() => {
      expect(mockCma.entry.references).toHaveBeenCalledWith({
        entryId: 'test-id',
        include: 3,
      });
    });
  });

  it('updates the selected include depth when installation parameters arrive after first render', async () => {
    const { rerender, container } = render(<EntryEditor />);

    await waitFor(() => {
      expect(mockCma.entry.get).toHaveBeenCalledWith({ entryId: 'test-id' });
    });

    mockSdk.parameters.installation.configOptions = {
      displayDataTypes: 'true',
      iconStyle: 'triangle',
      collapsed: 'true',
      theme: 'rjv-default',
      defaultIncludeDepth: '2',
    };

    rerender(<EntryEditor />);

    await waitFor(() => {
      expect(
        (container.querySelector('select[name="includeDepth"]') as HTMLSelectElement).value
      ).toBe('2');
      expect(mockCma.entry.references).toHaveBeenCalledWith({
        entryId: 'test-id',
        include: 2,
      });
    });
  });
});
