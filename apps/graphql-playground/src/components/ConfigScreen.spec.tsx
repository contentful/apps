import React from 'react';
import ConfigScreen from './ConfigScreen';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    const mockSdk: any = {
      app: {
        onConfigure: jest.fn(),
        getParameters: jest.fn().mockReturnValueOnce({}),
        setReady: jest.fn()
      }
    };
    const { getByText } = render(<ConfigScreen sdk={mockSdk} />);

    // simulate the user clicking the install button
    const configurationData = await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(
      getByText('Welcome to your contentful app. This is your config page.')
    ).toBeInTheDocument();
  });
});
