import React from 'react';
import { configure, render, cleanup } from '@testing-library/react';
import { TypeFormField } from './TypeFormField';
import { typeforms } from '../__mocks__/typeforms';
import { sdk as mockSdk } from '../__mocks__/sdk';

configure({
  testIdAttribute: 'data-test-id'
});

window.fetch = jest.fn(() => ({
  json: () => typeforms
})) as any;

describe('TypeFormField', () => {
  afterEach(cleanup);

  it('should render successfully when the user is signed in', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'some token')
      },
      writable: true
    });
    const component = render(<TypeFormField sdk={mockSdk} />);
    await component.findByTestId('typeform-select');
    expect(component.container).toMatchSnapshot();
  });

  it('should render the auth button when the user is not authenticated', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null)
      },
      writable: true
    });
    const component = render(<TypeFormField sdk={mockSdk} />);
    await component.findByTestId('typeform-auth');
    expect(component.container).toMatchSnapshot();
  });

  it('should render the error screen if something goes wrong', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'token')
      },
      writable: true
    });

    window.fetch = jest.fn(() => ({
      json: () => new Error()
    })) as any;

    const component = render(<TypeFormField sdk={mockSdk} />);
    await component.findByText(/^We could not fetch your typeforms/);
    expect(component.container).toMatchSnapshot();
  });
});
