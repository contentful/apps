import React from 'react';
import Field from './Field';
import { render } from '@testing-library/react';
import { mockCma, mockSdk, mockAutoResizer } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => mockAutoResizer,
}));

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field />);

    expect(getByText('Show JSON')).toBeInTheDocument();
  });
});
