import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import Field from './Field';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field />);

    expect(getByText('Hello Entry Field Component (AppId: test-app)')).toBeTruthy();
  });
});
