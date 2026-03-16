import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createMockSdk } from './mocks';
import Field from '../src/locations/Field';
import type { FormObject } from '../src/types';

const mockForms: FormObject[] = [
  { id: 'form-1', url: 'https://marketo.example.com/form-1', name: 'Newsletter Signup' },
  { id: 'form-2', url: 'https://marketo.example.com/form-2', name: 'Contact Us' },
  { id: 'form-3', url: 'https://marketo.example.com/form-3', name: 'Demo Request' },
];

let mockSdk: ReturnType<typeof createMockSdk>;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: vi.fn(),
}));

const mockActionCallSuccess = (forms: FormObject[] = mockForms) => {
  mockSdk.cma.appActionCall.createWithResponse.mockResolvedValue({
    response: { body: JSON.stringify({ forms }) },
  });
};

const mockActionCallNoResult = () => {
  mockSdk.cma.appActionCall.createWithResponse.mockResolvedValue({
    response: { body: JSON.stringify({}) },
  });
};

const mockActionCallError = () => {
  mockSdk.cma.appActionCall.createWithResponse.mockRejectedValue(new Error('Network error'));
};

const mockActionCallPending = () => {
  mockSdk.cma.appActionCall.createWithResponse.mockImplementation(
    () => new Promise(() => undefined)
  );
};

const waitForAutocomplete = async () => {
  await waitFor(() => {
    expect(screen.getByPlaceholderText('Select a form')).toBeInTheDocument();
  });
  return screen.getByPlaceholderText('Select a form');
};

const selectForm = async (user: ReturnType<typeof userEvent.setup>, formName: string) => {
  const input = await waitForAutocomplete();
  await user.click(input);

  await waitFor(() => {
    expect(screen.getByText(formName)).toBeInTheDocument();
  });

  await user.click(screen.getByText(formName));
  return input;
};

describe('Field component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSdk();
    mockSdk.field.getValue.mockReturnValue(undefined);
    mockSdk.field.setValue.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  describe('rendering', () => {
    it('should show loading text and spinner while forms are loading', () => {
      mockActionCallPending();

      render(<Field />);

      expect(screen.getByText(/Loading Marketo forms/i)).toBeInTheDocument();
    });

    it('should render without the autocomplete when forms list is empty', async () => {
      mockActionCallSuccess([]);

      render(<Field />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Marketo data/i)).not.toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('Select a form')).not.toBeInTheDocument();
      expect(screen.getByText(/No Marketo forms found/i)).toBeInTheDocument();
    });

    it('should update the field value when a form is selected', async () => {
      const user = userEvent.setup();
      mockActionCallSuccess();

      render(<Field />);

      await selectForm(user, 'Newsletter Signup');

      expect(mockSdk.field.setValue).toHaveBeenCalledWith({
        id: 'form-1',
        url: 'https://marketo.example.com/form-1',
      });
    });
  });

  describe('Pre-selected form', () => {
    it('should display the saved form on load', async () => {
      mockSdk.field.getValue.mockReturnValue({
        id: 'form-2',
        url: 'https://marketo.example.com/form-2',
      });
      mockActionCallSuccess();

      render(<Field />);

      const input = await waitForAutocomplete();
      expect(input).toHaveValue('Contact Us');
    });
  });

  describe('Error states', () => {
    it('should show configuration error when response has no result', async () => {
      mockActionCallNoResult();

      render(<Field />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Could not load Marketo forms. Please try again or contact a space admin.'
          )
        ).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('Select a form')).not.toBeInTheDocument();
    });

    it('should show generic error when fetch fails', async () => {
      mockActionCallError();

      render(<Field />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Could not load Marketo forms. Please try again or contact a space admin.'
          )
        ).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('Select a form')).not.toBeInTheDocument();
    });
  });

  describe('Form selection', () => {
    it('should exclude the selected form from the dropdown list', async () => {
      const user = userEvent.setup();
      mockActionCallSuccess();

      render(<Field />);

      const input = await selectForm(user, 'Newsletter Signup');

      await user.click(input);

      await waitFor(() => {
        expect(screen.queryByText('Newsletter Signup')).not.toBeInTheDocument();
        expect(screen.getByText('Contact Us')).toBeInTheDocument();
        expect(screen.getByText('Demo Request')).toBeInTheDocument();
      });
    });

    it('should filter forms case-insensitively when typing', async () => {
      const user = userEvent.setup();
      mockActionCallSuccess();

      render(<Field />);

      const input = await waitForAutocomplete();
      await user.click(input);
      await user.type(input, 'demo');

      await waitFor(() => {
        expect(screen.getByText('Demo Request')).toBeInTheDocument();
      });

      expect(screen.queryByText('Newsletter Signup')).not.toBeInTheDocument();
      expect(screen.queryByText('Contact Us')).not.toBeInTheDocument();
    });
  });

  describe('Remove form', () => {
    it('should clear the field value and restore all forms in the dropdown when input is cleared', async () => {
      const user = userEvent.setup();
      mockActionCallSuccess();

      render(<Field />);

      const input = await selectForm(user, 'Contact Us');

      await user.clear(input);

      expect(mockSdk.field.setValue).toHaveBeenCalledWith({ id: '', name: '', url: '' });

      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Newsletter Signup')).toBeInTheDocument();
        expect(screen.getByText('Contact Us')).toBeInTheDocument();
        expect(screen.getByText('Demo Request')).toBeInTheDocument();
      });
    });
  });
});
