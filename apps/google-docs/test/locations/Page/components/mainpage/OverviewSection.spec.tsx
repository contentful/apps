import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PreviewPayload } from '@types';
import OverviewSection from '../../../../../src/locations/Page/components/mainpage/OverviewSection';
import { createMockSDK } from '../../../../mocks';

const { mockFetchContentTypesInfoByIds } = vi.hoisted(() => ({
  mockFetchContentTypesInfoByIds: vi.fn(),
}));

vi.mock('../../../../../src/utils/getEntryTitle', async () => {
  const actual = await vi.importActual('../../../../../src/utils/getEntryTitle');
  return {
    ...actual,
    fetchContentTypesInfoByIds: mockFetchContentTypesInfoByIds,
  };
});

vi.mock('../../../../../src/services/entryService', () => ({
  createEntriesFromPreviewPayload: vi.fn(),
}));

describe('OverviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves manual checkbox changes when content type labels load asynchronously', async () => {
    const sdk = createMockSDK();
    const payload: PreviewPayload = {
      entries: [
        {
          tempId: 'page_1',
          contentTypeId: 'page',
          fields: {
            title: { 'en-US': 'Event detail' },
          },
        },
      ],
      assets: [],
      referenceGraph: {},
      normalizedDocument: {
        documentId: 'doc-1',
        title: 'Doc',
        contentBlocks: [],
        tables: [],
      },
    };

    let resolveContentTypes:
      | ((value: Map<string, { name: string; displayField?: string }>) => void)
      | undefined;

    mockFetchContentTypesInfoByIds.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveContentTypes = resolve;
        })
    );

    render(
      <OverviewSection
        sdk={sdk as ReturnType<typeof createMockSDK>}
        payload={payload}
        onReturnToMainPage={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    await act(async () => {
      resolveContentTypes?.(
        new Map([
          [
            'page',
            {
              name: 'Page',
              displayField: 'title',
            },
          ],
        ])
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Page')).toBeTruthy();
    });

    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });
});
