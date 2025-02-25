import {fireEvent, screen, render} from '@testing-library/react';
import { describe, expect, it, vi} from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen, {BRAZE_DOCUMENTATION} from './ConfigScreen';
import userEvent from '@testing-library/user-event';


vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  const { getByText } = render(<ConfigScreen />);

  it('Component text exists', async () => {
    expect(getByText('Set up Braze')).toBeTruthy();
  });

  it('renders the braze link correctly', () => {
    const brazeLink = getByText("Braze's Connected Content feature");

    expect(brazeLink).toBeTruthy();
    expect(brazeLink.closest('a')?.getAttribute('href')).toBe(BRAZE_DOCUMENTATION);
  });

  it('renders the link to manage api keys', () => {
    const brazeLink = getByText("Manage API");

    expect(brazeLink).toBeTruthy();
    expect(brazeLink.closest('a')?.getAttribute('href')).toBe(`https://app.contentful.com/spaces/${mockSdk.spaceId}/api/keys`);
  });

  it('has an input that sets api key correctly', () => {
    const input = screen.getAllByTestId('apiKey')[0];
    fireEvent.change(input, {
      target:{ value: `A test value for input` }
    })

    const inputExpected = screen.getAllByTestId('apiKey')[0] as HTMLInputElement;
    expect(inputExpected.value).toEqual(`A test value for input`)
  });

  it('when installed the api key is set correctly', async () => {
    const user = userEvent.setup();

    const apiKeyInput = screen.getAllByTestId('apiKey')[0];
    await user.type(apiKeyInput, 'valid-api-key-123');
    const result = await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();

    expect(result).toEqual({
      parameters: { apiKey: 'valid-api-key-123' }
    });
  });

});