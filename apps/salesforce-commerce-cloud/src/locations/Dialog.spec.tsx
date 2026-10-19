import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma } from '../../test/mocks';
import Dialog from './Dialog';

const dialogSdk = {
  ids: { app: 'test-app', space: 'space', environment: 'master' },
  close: vi.fn(),
  notifier: { error: vi.fn() },
  parameters: { invocation: { selectMultiple: true, fieldType: 'promotion' } },
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => dialogSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => undefined,
}));

describe('Dialog component', () => {
  it('titles the picker for the configured field type', () => {
    const { getByText } = render(<Dialog />);

    expect(getByText('Select promotions')).toBeTruthy();
  });
});
