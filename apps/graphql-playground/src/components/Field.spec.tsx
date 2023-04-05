import React from 'react';
import Field from './Field';
import { render } from '@testing-library/react';
import { mockSdk } from './test-utils/mocksdk';

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field sdk={mockSdk} />);

    expect(
      getByText(/GraphQL playground is not supported in the Entry field location./)
    ).toBeInTheDocument();
  });
});
