import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createMockSdk } from './mocks';
import Field from '../src/locations/Field';
import type { FormObject } from '../src/locations/Field';

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

// Mocks for fetch requests. This will change when we use contentful functions.
const mockFetchSuccess = (forms: FormObject[] = mockForms) => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    json: () => Promise.resolve({ result: forms }),
  } as Response);
};

const mockFetchNoResult = () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    json: () => Promise.resolve({}),
  } as Response);
};

const mockFetchError = () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
};

const mockFetchPending = () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    () => new Promise(() => undefined) as unknown as ReturnType<typeof fetch>
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
      mockFetchPending();

      render(<Field />);

      expect(screen.getByText(/Loading Marketo data/i)).toBeInTheDocument();
    });

    it('should render without the autocomplete when forms list is empty', async () => {
      mockFetchSuccess([]);

      render(<Field />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Marketo data/i)).not.toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('Select a form')).not.toBeInTheDocument();
    });

    it('should not show the Remove Form button when no form is selected', async () => {
      mockFetchSuccess();

      render(<Field />);

      await waitForAutocomplete();

      expect(screen.queryByText('Remove Form')).not.toBeInTheDocument();
    });

    it('should update the field value when a form is selected and show the Remove Form button', async () => {
      const user = userEvent.setup();
      mockFetchSuccess();

      render(<Field />);

      await selectForm(user, 'Newsletter Signup');

      expect(mockSdk.field.setValue).toHaveBeenCalledWith({
        id: 'form-1',
        url: 'https://marketo.example.com/form-1',
      });

      expect(screen.getByText('Remove Form')).toBeInTheDocument();
    });
  });

  describe('Pre-selected form', () => {
    it('should display the saved form and show Remove Form button on load', async () => {
      mockSdk.field.getValue.mockReturnValue({
        id: 'form-2',
        url: 'https://marketo.example.com/form-2',
      });
      mockFetchSuccess();

      render(<Field />);

      const input = await waitForAutocomplete();
      expect(input).toHaveValue('Contact Us');
      expect(screen.getByText('Remove Form')).toBeInTheDocument();
    });
  });

  describe('Error states', () => {
    it('should show configuration error when response has no result', async () => {
      mockFetchNoResult();

      render(<Field />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Something is wrong with the Marketo App. Please ask a space admin to check the configuration.'
          )
        ).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('Select a form')).not.toBeInTheDocument();
    });

    it('should show generic error when fetch fails', async () => {
      mockFetchError();

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
      mockFetchSuccess();

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
      mockFetchSuccess();

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
    it('should clear the field value, hide the button, and restore all forms in the dropdown', async () => {
      const user = userEvent.setup();
      mockFetchSuccess();

      render(<Field />);

      const input = await selectForm(user, 'Contact Us');

      await waitFor(() => {
        expect(screen.getByText('Remove Form')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Remove Form'));

      expect(mockSdk.field.setValue).toHaveBeenCalledWith(null);
      await waitFor(() => {
        expect(screen.queryByText('Remove Form')).not.toBeInTheDocument();
      });

      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('Newsletter Signup')).toBeInTheDocument();
        expect(screen.getByText('Contact Us')).toBeInTheDocument();
        expect(screen.getByText('Demo Request')).toBeInTheDocument();
      });
    });
  });
});
