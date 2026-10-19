import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReferenceHealthNote from './ReferenceHealthNote';

const items: Record<string, { ok: boolean; data?: unknown }> = {};

const createWithResponse = vi.fn(async (_params: unknown, { parameters }: any) => {
  const result = items[parameters.productId];
  return {
    response: {
      body: JSON.stringify(
        result.ok ? { ok: true, data: result.data } : { ok: false, error: { message: 'missing' } }
      ),
    },
  };
});

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({
    ids: { app: 'test-app', space: 'space', environment: 'master' },
    field: { locale: 'en-US' },
    parameters: { instance: { fieldType: 'product' } },
  }),
  useCMA: () => ({ appActionCall: { createWithResponse } }),
}));

const renderNote = (value: string | string[]) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReferenceHealthNote value={value} />
    </QueryClientProvider>
  );

describe('ReferenceHealthNote', () => {
  beforeEach(() => {
    for (const key of Object.keys(items)) delete items[key];
    createWithResponse.mockClear();
  });

  it('renders nothing when every reference is healthy', async () => {
    items.a = { ok: true, data: { id: 'a', online: true, inStock: true } };
    const { container } = renderNote('a');

    await waitFor(() => expect(createWithResponse).toHaveBeenCalled());
    expect(container.textContent).toBe('');
  });

  it('warns about references the storefront would not show', async () => {
    items.a = { ok: true, data: { id: 'a', online: false } };
    items.b = { ok: true, data: { id: 'b', online: true } };
    const { findByText } = renderNote(['a', 'b']);

    expect(await findByText('1 product may not display on the storefront.')).toBeTruthy();
  });

  it('reports references that could not be found alongside flagged ones', async () => {
    items.a = { ok: false };
    items.b = { ok: false };
    items.c = { ok: true, data: { id: 'c', inStock: false } };
    const { findByText } = renderNote(['a', 'b', 'c']);

    expect(
      await findByText(
        '2 products could not be found in Salesforce Commerce Cloud. 1 product may not display on the storefront.'
      )
    ).toBeTruthy();
  });
});
