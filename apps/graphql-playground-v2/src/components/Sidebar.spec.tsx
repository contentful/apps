import React from 'react';
import Sidebar from './Sidebar';
import { render } from '@testing-library/react';
import { mockSdk } from './test-utils/mocksdk';

describe('Sidebar component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Sidebar sdk={mockSdk} />);

    expect(
      getByText(
        /To use GraphQL playground. Please define the CPA installation parameter in your app configuration./
      )
    ).toBeInTheDocument();
  });
});
