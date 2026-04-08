import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import PreviewFieldMultiSelect, {
  getDeduplicatedFields,
} from '../../src/components/PreviewFieldMultiSelect';

describe('PreviewFieldMultiSelect', () => {
  const get = vi.fn();
  const setSelectedPreviewFieldIds = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deduplicates fields shared across selected content types', async () => {
    expect(
      getDeduplicatedFields([
        {
          fields: [
            { id: 'title', type: 'Symbol' },
            { id: 'slug', type: 'Symbol' },
            { id: 'url', type: 'Symbol' },
            { id: 'body', type: 'Text' },
          ],
        },
        {
          fields: [
            { id: 'title', type: 'Symbol' },
            { id: 'url', type: 'Symbol' },
            { id: 'summary', type: 'Symbol' },
            { id: 'modules', type: 'Array' },
          ],
        },
      ])
    ).toEqual([
      { id: 'slug', name: 'slug' },
      { id: 'summary', name: 'summary' },
      { id: 'title', name: 'title' },
      { id: 'url', name: 'url' },
    ]);
  });

  it('clears selected preview fields when no content types are selected', async () => {
    render(
      <PreviewFieldMultiSelect
        selectedContentTypes={[]}
        selectedPreviewFieldIds={['slug']}
        setSelectedPreviewFieldIds={setSelectedPreviewFieldIds}
        cma={{ contentType: { get } } as any}
      />
    );

    await waitFor(() => {
      expect(setSelectedPreviewFieldIds).toHaveBeenCalledWith([]);
    });
  });

  it('fetches fields for the selected content types', async () => {
    get.mockResolvedValue({
      fields: [
        { id: 'title', type: 'Symbol' },
        { id: 'slug', type: 'Symbol' },
        { id: 'body', type: 'Text' },
      ],
    });

    render(
      <PreviewFieldMultiSelect
        selectedContentTypes={[
          { id: 'blogPost', name: 'Blog Post' },
          { id: 'article', name: 'Article' },
        ]}
        selectedPreviewFieldIds={['slug']}
        setSelectedPreviewFieldIds={setSelectedPreviewFieldIds}
        cma={{ contentType: { get } } as any}
      />
    );

    await waitFor(() => {
      expect(get).toHaveBeenCalledTimes(2);
    });
  });
});
