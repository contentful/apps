import React from 'react';
import Page from './Page';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

describe('Page component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Page cma={mockCma} sdk={mockSdk} />);

    expect(getByText('Hello Page Component')).toBeInTheDocument();
  });
});
