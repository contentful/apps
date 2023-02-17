import React from 'react';
import Field from './Field';
import { render } from '@testing-library/react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { mockSdk } from '../test/mocks';

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field sdk={mockSdk as unknown as FieldExtensionSDK} />);

    expect(getByText('Loading Wistia videos')).toBeInTheDocument();
  });
});
