import React from 'react';
import ConfigScreen from './ConfigScreen';
import { render, screen, act } from '@testing-library/react';
import { mockSdk } from '../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('@contentful/f36-autocomplete', () => ({
  Autocomplete: ({ items, itemToString }) => (
    <div>
      <input placeholder="Search" />
      <ul>
        {items.map((item) => (
          <li key={item.sys.id}>{itemToString(item)}</li>
        ))}
      </ul>
    </div>
  ),
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    mockSdk.cma.contentType.getMany = () => ({
      items: [{ sys: { id: 'content-type-1' }, name: 'Test Content Type' }],
    });
  });

  it('renders the Config Screen with the correct heading and paragraph', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByRole('heading', { name: /App Config/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome to your Contentful app. This is your config page./i)
    ).toBeInTheDocument();
  });

  it('allows user to input API Key', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    const input = screen.getByLabelText(/OpenAI API Key/i);
    expect(input).toBeInTheDocument();

    await act(async () => {
      const inputElement = input as HTMLInputElement;
      inputElement.focus();
      inputElement.value = 'test-api-key';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(input).toHaveValue('test-api-key');
  });

  it('shows and allows content type selection', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    const contentTypeInput = screen.getByPlaceholderText(/Search/i);
    expect(contentTypeInput).toBeInTheDocument();

    await act(async () => {
      contentTypeInput.focus();
      contentTypeInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      );
      const item = screen.getByText(/Test Content Type/i);
      item.click();
    });

    expect(screen.getByText(/content-type-1/i)).toBeInTheDocument();
  });

  it('calls the correct onConfigure function', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    await act(async () => {
      await mockSdk.app.onConfigure.mock.calls[0][0]();
    });

    expect(mockSdk.app.onConfigure).toHaveBeenCalled();
    expect(mockSdk.app.getCurrentState).toHaveBeenCalled();
  });
});
