import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FieldType, SearchPage } from '../../utils/resources';
import SearchPicker from './SearchPicker';

const { search, sdk, cma } = vi.hoisted(() => ({
  search: vi.fn<(fieldType: FieldType, query?: string, offset?: number) => Promise<SearchPage>>(),
  cma: {},
  sdk: {
    ids: { app: 'test-app', space: 'space', environment: 'master' },
    close: vi.fn(),
    notifier: { error: vi.fn() },
    parameters: { invocation: { selectMultiple: true, fieldType: 'store' as FieldType } },
  },
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

vi.mock('../../utils/Sfcc', () => ({
  default: class {
    search = search;
  },
}));

async function advanceSearch(milliseconds = 500) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

describe('SearchPicker pagination', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    search.mockReset();
    sdk.parameters.invocation.fieldType = 'store';
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('loads a second page and saves selections from both pages', async () => {
    search
      .mockResolvedValueOnce({
        items: Array.from({ length: 50 }, (_, index) => ({
          id: `store-${index + 1}`,
          name: `Store ${index + 1}`,
        })),
        nextOffset: 50,
      })
      .mockResolvedValueOnce({ items: [{ id: 'store-51', name: 'Store 51' }] });
    const view = render(<SearchPicker />);
    await advanceSearch();
    fireEvent.click(view.getByText('Store 1'));
    fireEvent.click(view.getByRole('button', { name: 'Load more' }));
    await advanceSearch(0);

    expect(search).toHaveBeenLastCalledWith('store', '', 50);
    expect(view.getByText('Store 1')).toBeTruthy();
    fireEvent.click(view.getByText('Store 51'));
    expect(view.queryByRole('button', { name: 'Load more' })).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(sdk.close).toHaveBeenCalledWith(['store-1', 'store-51']);
  });

  it('resets pagination for short searches while keeping selections', async () => {
    search
      .mockResolvedValueOnce({ items: [{ id: 'store-1', name: 'First store' }], nextOffset: 50 })
      .mockResolvedValueOnce({ items: [{ id: 'store-51', name: 'Last store' }] })
      .mockResolvedValueOnce({ items: [{ id: 'US', name: 'US' }] });
    const view = render(<SearchPicker />);
    await advanceSearch();
    fireEvent.click(view.getByText('First store'));
    fireEvent.click(view.getByRole('button', { name: 'Load more' }));
    await advanceSearch(0);
    fireEvent.change(view.getByRole('searchbox'), { target: { value: 'US' } });
    await advanceSearch();

    expect(search).toHaveBeenLastCalledWith('store', 'US', 0);
    expect(view.queryByText('Last store')).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(sdk.close).toHaveBeenCalledWith(['store-1']);
  });

  it('keeps the current results and allows retry when loading more fails', async () => {
    search
      .mockResolvedValueOnce({ items: [{ id: 'first', name: 'First store' }], nextOffset: 50 })
      .mockRejectedValueOnce(new Error('Service unavailable'))
      .mockResolvedValueOnce({ items: [{ id: 'last', name: 'Last store' }] });
    const view = render(<SearchPicker />);
    await advanceSearch();
    fireEvent.click(view.getByRole('button', { name: 'Load more' }));
    await advanceSearch(0);

    expect(view.getByText('First store')).toBeTruthy();
    expect(sdk.notifier.error).toHaveBeenCalledWith('Service unavailable');
    fireEvent.click(view.getByRole('button', { name: 'Load more' }));
    await advanceSearch(0);
    expect(search).toHaveBeenLastCalledWith('store', '', 50);
    expect(view.getByText('Last store')).toBeTruthy();
  });

  it('ignores an old page response after the search changes', async () => {
    let resolvePage: (page: SearchPage) => void = () => undefined;
    search
      .mockResolvedValueOnce({ items: [{ id: 'first' }], nextOffset: 50 })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePage = resolve;
          })
      )
      .mockResolvedValueOnce({ items: [{ id: 'new', name: 'New result' }] });
    const view = render(<SearchPicker />);
    await advanceSearch();
    fireEvent.click(view.getByRole('button', { name: 'Load more' }));
    await advanceSearch(0);
    fireEvent.change(view.getByRole('searchbox'), { target: { value: 'new' } });
    await advanceSearch();
    await act(async () => {
      resolvePage({ items: [{ id: 'old', name: 'Old result' }], nextOffset: 100 });
    });

    expect(view.getByText('New result')).toBeTruthy();
    expect(view.queryByText('Old result')).toBeNull();
    expect(view.queryByRole('button', { name: 'Load more' })).toBeNull();
  });

  it('identifies campaign search as ID search', async () => {
    sdk.parameters.invocation.fieldType = 'campaign';
    search.mockResolvedValue({ items: [] });
    const view = render(<SearchPicker />);
    expect(view.getByPlaceholderText('Search by campaign ID...')).toBeTruthy();
    fireEvent.change(view.getByRole('searchbox'), { target: { value: 'ID' } });
    await advanceSearch();
    expect(search).toHaveBeenLastCalledWith('campaign', 'ID', 0);
  });
});
