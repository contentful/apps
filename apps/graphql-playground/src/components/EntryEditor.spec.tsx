import React from 'react';
import EntryEditor from './EntryEditor';
import { render } from '@testing-library/react';

describe('Entry component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<EntryEditor />);

    expect(getByText('Hello Entry Editor Component')).toBeInTheDocument();
  });
});
