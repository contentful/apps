import React from 'react';
import EntryEditor from './EntryEditor';
import { render } from '@testing-library/react';
import { mockCma } from '../../test/mocks';

describe('Entry component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<EntryEditor cma={mockCma} />);

    expect(getByText('Hello Entry Editor Component')).toBeInTheDocument();
  });
});
