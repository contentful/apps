import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockSdk } from '../../test/mocks';
import Dialog from './Dialog';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Dialog component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Dialog />);

    expect(getByText('Hello Dialog Component (AppId: test-app)')).toBeTruthy();
  });
});
