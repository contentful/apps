import { getAllByTestId, getByText, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../../../test/mocks';
import TextCounter from './TextCounter';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('Text Counter', () => {
  it('renders the current text count', () => {
    const { getByText, unmount } = render(<TextCounter text="test" />);
    expect(getByText('4 characters')).toBeTruthy();

    unmount();
  });

  it('renders the max character count', () => {
    const randomNumber = Math.floor(Math.random() * 100);
    const { getByText, unmount } = render(<TextCounter text="test" maxLength={randomNumber} />);
    expect(getByText(`Maximum ${randomNumber} characters`)).toBeTruthy();

    unmount();
  });

  it('displays an error message if the text is below the minimum', () => {
    const { getByText, unmount } = render(<TextCounter text="test" minLength={5} />);
    expect(getByText('Please lengthen the text')).toBeTruthy();

    unmount();
  });

  it('displays an error message if the text is above the maximum', () => {
    const { getByText, unmount } = render(<TextCounter text="testestest" maxLength={3} />);
    expect(getByText('10 characters')).toBeTruthy();
    expect(getByText('Please shorten the text')).toBeTruthy();

    unmount();
  });

  it('updates the text count when the text changes', async () => {
    const { getByText, rerender, unmount } = render(<TextCounter text="test" />);
    expect(getByText('4 characters')).toBeTruthy();

    rerender(<TextCounter text="testestest" />);
    await waitFor(() => expect(getByText('10 characters')).toBeTruthy());

    unmount();
  });

  it('updates the error message when the min length changes', async () => {
    const { getByText, rerender, unmount } = render(<TextCounter text="test" minLength={5} />);
    expect(getByText('Please lengthen the text')).toBeTruthy();

    rerender(<TextCounter text="test" minLength={3} />);
    await waitFor(() => expect(getByText('4 characters')).toBeTruthy());

    unmount();
  });

  it('updates the error message when the max length changes', async () => {
    const { getByText, rerender, unmount } = render(<TextCounter text="test" maxLength={3} />);
    expect(getByText('Please shorten the text')).toBeTruthy();

    rerender(<TextCounter text="test" maxLength={5} />);
    await waitFor(() => expect(getByText('4 characters')).toBeTruthy());

    unmount();
  });
});
