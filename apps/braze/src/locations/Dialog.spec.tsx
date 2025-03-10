import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import Dialog from './Dialog';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

// TODO: add more
describe('Dialog component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Dialog />);

    expect(getByText('Braze Connected Content Call')).toBeTruthy();
  });
});
