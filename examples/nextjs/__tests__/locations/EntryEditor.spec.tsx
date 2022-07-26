import React from 'react';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../__tests__/mocks';
import EntryEditor from '@/components/locations/EntryEditor';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Entry component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<EntryEditor />);

    expect(getByText('Hello Entry Editor Component (AppId: test-app)')).toBeInTheDocument();
  });
});
