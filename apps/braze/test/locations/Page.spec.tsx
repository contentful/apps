import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import { render } from '@testing-library/react';
import React from 'react';
import Page from '../../src/locations/Page';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Page component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Page />);

    expect(getByText('Hello Page Component (AppId: test-app)')).toBeTruthy();
  });
});
