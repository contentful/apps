import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ContentTypeMultiSelect from '../../src/components/ContentTypeMultiSelect';

describe('ContentTypeMultiSelect', () => {
  it('does not refetch content types on every render when excluded ids are omitted', async () => {
    const getCurrentState = vi.fn().mockResolvedValue({});
    const getMany = vi.fn().mockResolvedValue({ items: [] });
    const setSelectedContentTypes = vi.fn();

    render(
      <ContentTypeMultiSelect
        selectedContentTypes={[]}
        setSelectedContentTypes={setSelectedContentTypes}
        sdk={{ app: { getCurrentState } } as any}
        cma={{ contentType: { getMany } } as any}
      />
    );

    await waitFor(() => {
      expect(getCurrentState).toHaveBeenCalledTimes(1);
      expect(getMany).toHaveBeenCalledTimes(1);
    });
  });
});
