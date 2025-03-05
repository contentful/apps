import React from 'react';
import Dialog from './Dialog';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Dialog component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Dialog />);

    expect(getByText('Hello Dialog Component (AppId: test-app)')).toBeInTheDocument();
  });
});
