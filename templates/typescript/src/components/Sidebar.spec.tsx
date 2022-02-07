import React from 'react';
import Sidebar from './Sidebar';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

describe('Sidebar component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Sidebar cma={mockCma} sdk={mockSdk} />);

    expect(getByText('Hello Sidebar Component')).toBeInTheDocument();
  });
});
