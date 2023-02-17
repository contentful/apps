import React from 'react';
import Field from './Field';
import { render } from '@testing-library/react';
import { FieldExtensionSDK } from '@contentful/app-sdk';

const mockSdk = {
  window: {
    startAutoResizer: jest.fn(),
  },
  parameters: {
    installation: {
      excludedProject: [],
      apiBearerToken: '',
    },
  },
  field: {
    getValue: jest.fn(),
  },
};

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field sdk={mockSdk as unknown as FieldExtensionSDK} />);

    expect(getByText('Loading Wistia videos')).toBeInTheDocument();
  });
});
