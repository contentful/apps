import React from 'react';
import Dialog from './Dialog';
import { render } from '@testing-library/react';
import { mockCma } from '../../test/mocks';

describe('Dialog component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Dialog cma={mockCma} />);

    expect(getByText('Hello Dialog Component')).toBeInTheDocument();
  });
});
