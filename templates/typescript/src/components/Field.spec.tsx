import React from 'react';
import Field from './Field';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field cma={mockCma} sdk={mockSdk} />);

    expect(getByText('Hello Entry Field Component')).toBeInTheDocument();
  });
});
