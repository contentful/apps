import React from 'react';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../__tests__/mocks';
import Dialog from '@/components/locations/Dialog';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Dialog component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Dialog />);

    expect(getByText('Hello Dialog Component (AppId: test-app)')).toBeInTheDocument();
  });
});
