import React from 'react';
import Dialog from './Dialog';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

describe('Dialog component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Dialog cma={mockCma} sdk={mockSdk} />);

    expect(getByText('Hello Dialog Component')).toBeInTheDocument();
  });
});
