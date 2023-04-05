import React from 'react';
import Page from './Page';
import { render } from '@testing-library/react';
import { mockSdk } from './test-utils/mocksdk';

describe('Page component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Page sdk={mockSdk} />);

    expect(
      getByText(
        'To use GraphQL playground. Please define the CPA installation parameter in your app configuration.'
      )
    ).toBeInTheDocument();
  });
});
