import React from 'react';
import Dialog from './Dialog';
import { render } from '@testing-library/react';

describe('Dialog component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Dialog />);

    expect(getByText('Hello Dialog Component')).toBeInTheDocument();
  });
});
