import React from 'react';
import Sidebar from './Sidebar';
import { render } from '@testing-library/react';

describe('Sidebar component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Sidebar />);

    expect(getByText('Hello Sidebar Component')).toBeInTheDocument();
  });
});
