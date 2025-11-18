import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from './mocks';
import Sidebar from '../src/locations/Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Sidebar component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Sidebar />);

    expect(getByText('Hello Sidebar Component (AppId: test-app)')).toBeTruthy();
  });
});
