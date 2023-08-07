import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import Home from './Home';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Home component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Home />);

    expect(getByText('Hello Home Component (AppId: test-app)')).toBeTruthy();
  });
});
