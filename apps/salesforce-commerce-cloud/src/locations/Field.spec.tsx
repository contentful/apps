import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { mockCma } from '../../test/mocks';
import Field from './Field';

const fieldSdk = {
  ids: { app: 'test-app', space: 'space', environment: 'master' },
  field: {
    type: 'Symbol',
    locale: 'en-US',
    getValue: vi.fn(() => undefined),
    onValueChanged: vi.fn(() => () => undefined),
  },
  parameters: { instance: { fieldType: 'customerGroup' } },
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => fieldSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => undefined,
}));

describe('Field component', () => {
  it('offers to select the configured field type', () => {
    const { getByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Field />
      </QueryClientProvider>
    );

    expect(getByText('Select a customer group')).toBeTruthy();
  });
});
