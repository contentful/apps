import { render, waitFor, screen, queryByRole } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../../../test/mocks';
import TextCounter from './TextCounter';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

const { getByTestId, getByText } = screen;

describe('Text Counter', () => {
  it('renders the current text count', () => {
    const { unmount } = render(<TextCounter text="test" />);
    expect(getByText('4 characters')).toBeTruthy();

    unmount();
  });

  it('renders the max character count', () => {
    const randomNumber = Math.floor(Math.random() * 100);
    const { unmount } = render(<TextCounter text="test" maxLength={randomNumber} />);
    expect(getByText(`Maximum ${randomNumber} characters`)).toBeTruthy();

    unmount();
  });

  it('displays an error icon and message if the text is below the minimum', () => {
    const { unmount } = render(<TextCounter text="test" minLength={5} />);
    expect(getByTestId('error-icon')).toBeTruthy();
    expect(getByText('Requires at least 5 characters')).toBeTruthy();

    unmount();
  });

  it('displays an error icon and message text if the text is above the maximum', () => {
    const { unmount } = render(<TextCounter text="testestest" maxLength={3} />);
    expect(getByTestId('error-icon')).toBeTruthy();
    expect(getByText('Maximum 3 characters')).toBeTruthy();

    unmount();
  });

  it('displays an error icon and message if the text is out of bounds for min and max', () => {
    const { unmount } = render(<TextCounter text="testestest" maxLength={8} minLength={3} />);
    expect(getByTestId('error-icon')).toBeTruthy();
    expect(getByText('Requires between 3 and 8 characters')).toBeTruthy();

    unmount();
  });

  it('updates the text count when the text changes', async () => {
    const { rerender, unmount } = render(<TextCounter text="test" />);
    expect(getByText('4 characters')).toBeTruthy();

    rerender(<TextCounter text="testestest" />);
    await waitFor(() => expect(getByText('10 characters')).toBeTruthy());

    unmount();
  });

  it('updates the error message when the min length changes', async () => {
    const { rerender, unmount } = render(<TextCounter text="test" minLength={5} />);
    expect(getByTestId('error-icon')).toBeTruthy();

    rerender(<TextCounter text="test" minLength={3} />);
    await waitFor(() => expect(getByText('Requires at least 3 characters')).toBeTruthy());

    const textCounter = getByTestId('text-counter');
    expect(queryByRole(textCounter, 'img', { hidden: true })).toBeNull;

    unmount();
  });

  it('updates the error message when the max length changes', async () => {
    const { rerender, unmount } = render(<TextCounter text="test" maxLength={3} />);
    expect(getByTestId('error-icon')).toBeTruthy();

    rerender(<TextCounter text="test" maxLength={5} />);
    await waitFor(() => expect(getByText('4 characters')).toBeTruthy());

    const textCounter = getByTestId('text-counter');
    expect(queryByRole(textCounter, 'img', { hidden: true })).toBeNull;

    unmount();
  });
});
