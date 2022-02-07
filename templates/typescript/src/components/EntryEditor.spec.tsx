import React from 'react';
import EntryEditor from './EntryEditor';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

describe('Entry component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<EntryEditor cma={mockCma} sdk={mockSdk} />);

    expect(getByText('Hello Entry Editor Component')).toBeInTheDocument();
  });
});
