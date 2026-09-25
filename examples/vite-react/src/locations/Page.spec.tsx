import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockSdk } from '../../test/mocks';
import Page from './Page';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Page />);

    expect(getByText('Hello Page Component (AppId: test-app)')).toBeTruthy();
  });
});
