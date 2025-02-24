import {fireEvent, screen, render} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen, {BRAZE_DOCUMENTATION} from './ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  const { getByText } = render(<ConfigScreen />);

  it('Component text exists', async () => {
    expect(getByText('Set up Braze')).toBeTruthy();
  });

  it('renders the external links correctly', () => {
    const brazeLink = getByText("Braze's Connected Content feature");

    expect(brazeLink).toBeTruthy();
    expect(brazeLink.closest('a')?.getAttribute('href')).toBe(BRAZE_DOCUMENTATION);
  });

  // TODO : Hacer test de la url con space id

  it('has an input that sets api key correctly', () => {
    const input = screen.getAllByTestId('apiKey')[0];
    fireEvent.change(input, {
      target:{ value: `A test value for input` }
    })

    const inputExpected = screen.getAllByTestId('apiKey')[0] as HTMLInputElement;
    expect(inputExpected.value).toEqual(`A test value for input`)
  });
});
