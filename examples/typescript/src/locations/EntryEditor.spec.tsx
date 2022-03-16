import React from 'react';
import EntryEditor from './EntryEditor';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk
}))

describe('Entry component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<EntryEditor cma={mockCma} />);

    expect(getByText('Hello Entry Editor Component (AppId: test-app)')).toBeInTheDocument();
  });
});
