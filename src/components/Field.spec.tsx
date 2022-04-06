import React from 'react';
import Field from './Field';
import { render } from '@testing-library/react';

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field />);

    expect(getByText('Hello Entry Field Component')).toBeInTheDocument();
  });
});
