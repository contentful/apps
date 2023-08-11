import { fireEvent, getByPlaceholderText, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../../../../../test/mocks';
import ButtonTextField, { buttons } from './ButtonTextField';
import { renderIntoDocument } from 'react-dom/test-utils';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('Button Text Field', () => {
  it('renders on the page', () => {
    const mockHandleInputChange = vi.fn();
    renderIntoDocument;
    const { getByText, getByPlaceholderText, unmount } = render(
      <ButtonTextField inputValue="" handleInputChange={mockHandleInputChange} />
    );

    expect(getByText('Shorter')).toBeTruthy();
    expect(getByPlaceholderText('eg. "Shorter, casual, for Star Wars fans..."')).toBeTruthy();
    unmount();
  });

  it('should add or remove its label to the text field on click', async () => {
    let testInputValue = '';
    const mockHandleInputChange = vi.fn((newVal: string | ((prev: string) => string)) => {
      if (typeof newVal === 'function') {
        testInputValue = newVal(testInputValue);
      } else {
        testInputValue = newVal;
      }

      renderComponent();
    });

    const { getByText, rerender, unmount } = render(
      <ButtonTextField inputValue={testInputValue} handleInputChange={mockHandleInputChange} />
    );

    const renderComponent = () => {
      rerender(
        <ButtonTextField inputValue={testInputValue} handleInputChange={mockHandleInputChange} />
      );
    };

    const randomButtonQueue = Array.from(
      { length: 20 },
      () => buttons[Math.floor(Math.random() * buttons.length)]
    );

    const randomButtonQueueWithDuplicates = [
      ...randomButtonQueue,
      ...randomButtonQueue,
      ...randomButtonQueue,
    ];

    for (let i = 0; i < randomButtonQueueWithDuplicates.length; i++) {
      const button = randomButtonQueueWithDuplicates[i];
      const lowerCaseButton = button.toLowerCase();

      const oldTestInputValue = testInputValue;

      getByText(button).click();
      await waitFor(() => expect(mockHandleInputChange).toHaveBeenCalledTimes(i + 1));

      if (oldTestInputValue.includes(lowerCaseButton)) {
        await waitFor(() =>
          expect(testInputValue).toEqual(oldTestInputValue.replace(`${lowerCaseButton}, `, ''))
        );
      } else {
        await waitFor(() =>
          expect(testInputValue).toEqual(`${oldTestInputValue}${lowerCaseButton}, `)
        );
      }
    }

    unmount();
  });

  it('should update the input value when the user types', async () => {
    let testInputValue = '';
    const mockHandleInputChange = vi.fn((newVal: string | ((prev: string) => string)) => {
      if (typeof newVal === 'function') {
        testInputValue = newVal(testInputValue);
      } else {
        testInputValue = newVal;
      }
      renderComponent();
    });

    const { getByText, rerender } = render(
      <ButtonTextField inputValue={testInputValue} handleInputChange={mockHandleInputChange} />
    );
    const renderComponent = () => {
      rerender(
        <ButtonTextField inputValue={testInputValue} handleInputChange={mockHandleInputChange} />
      );
    };

    getByText('Casual').click();
    await waitFor(() => {
      expect(testInputValue).toEqual('casual, ');
    });

    // Type in field
    mockHandleInputChange((prev: string) => prev + 'test');
    await waitFor(() => {
      expect(testInputValue).toEqual('casual, test');
    });

    getByText('Casual').click();
    await waitFor(() => {
      expect(testInputValue).toEqual('test');
    });

    // Adds a comma
    getByText('Casual').click();
    await waitFor(() => {
      expect(testInputValue).toEqual('test, casual, ');
    });

    // Remove test from field
    mockHandleInputChange((prev: string) => ' casual, ');
    await waitFor(() => {
      expect(testInputValue).toEqual(' casual, ');
    });

    // Verify we remove extra spaces on button click
    getByText('Shorter').click();
    await waitFor(() => {
      expect(testInputValue).toEqual('casual, shorter, ');
    });

    getByText('Shorter').click();
    await waitFor(() => {
      expect(testInputValue).toEqual('casual, ');
    });

    // Add weird spaces
    mockHandleInputChange((prev: string) => '    casual,   ');
    await waitFor(() => {
      expect(testInputValue).toEqual('    casual,   ');
    });

    // Verify we remove extra spaces
    getByText('Casual').click();
    await waitFor(() => {
      expect(testInputValue).toEqual('');
    });
  });
});
