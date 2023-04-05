import React from 'react';
import EntryEditor from './EntryEditor';
import { act, render, screen } from '@testing-library/react';
import { mockSdk } from './test-utils/mocksdk';

describe('Entry component', () => {
  it('Component text exists', async () => {
    await act(async () => {
      render(<EntryEditor sdk={mockSdk} />);
    });

    expect(
      screen.getByText(/GraphQL playground is not supported in the Entry editor location./)
    ).toBeInTheDocument();
  });
});
