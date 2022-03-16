import React from 'react';
import Dialog from './Dialog';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk
}))

describe('Dialog component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Dialog cma={mockCma} />);

    expect(getByText('Hello Dialog Component (AppId: test-app)')).toBeInTheDocument();
  });
});
