import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createMockSdk } from './mocks';
import Field from '../src/locations/Field';
import { delay } from '../src/utils';
import { GET_FOLDER_STATUS_APP_ACTION_ID, GET_FORMS_APP_ACTION_ID } from '../src/const';
import type { FormObject, MarketoFormWithFolder } from '../src/types';

const mockForms: FormObject[] = [
  { id: 'form-1', url: 'https://marketo.example.com/form-1', name: 'Newsletter Signup' },
  { id: 'form-2', url: 'https://marketo.example.com/form-2', name: 'Contact Us' },
  { id: 'form-3', url: 'https://marketo.example.com/form-3', name: 'Demo Request' },
];

const FORM_ERROR_TEXT = 'Could not load Marketo forms. Please try again or contact a space admin.';

let mockSdk: ReturnType<typeof createMockSdk>;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: vi.fn(),
}));

vi.mock('../src/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/utils')>()),
  delay: vi.fn(),
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
    vi.mocked(delay).mockResolvedValue(undefined);
    localStorage.clear();
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

  describe('Paginated loading', () => {
    type Page = { forms: MarketoFormWithFolder[]; nextOffset?: number } | { rateLimited: true };
    type FolderStatus = { folders: object[]; rateLimited?: boolean };

    const form = (id: string, name: string): FormObject => ({
      id,
      name,
      url: `https://marketo.example.com/${id}`,
    });

    const page1: Page = { forms: [form('form-1', 'Newsletter Signup')], nextOffset: 200 };
    const page2: Page = { forms: [form('form-4800', 'EN Product Marketing')], nextOffset: 400 };
    const page3: Page = { forms: [form('form-5115', 'EN Brand Invite')] };

    const callsTo = (appActionId: string) =>
      mockSdk.cma.appActionCall.createWithResponse.mock.calls
        .filter(
          (call: unknown[]) => (call[0] as { appActionId: string }).appActionId === appActionId
        )
        .map((call: unknown[]) => (call[1] as { parameters: Record<string, unknown> }).parameters);

    const requestedOffsets = () => callsTo(GET_FORMS_APP_ACTION_ID).map(({ offset }) => offset);
    const requestedFolders = () =>
      callsTo(GET_FOLDER_STATUS_APP_ACTION_ID).map(({ folders }) => folders);

    // Reports every requested folder as live unless listed in `archived`.
    const folderStatuses =
      (archived: string[] = []) =>
      (folders: string): FolderStatus => ({
        folders: folders.split(',').map((ref) => {
          const [type, id] = ref.split(':');
          return { id: Number(id), type, isArchive: archived.includes(ref) };
        }),
      });

    // Serves pages by offset; an array is served one response per call.
    // Offsets listed in `held` stay pending until released, so tests can
    // observe the UI between pages.
    const mockPages = (
      pages: Record<number, Page | Page[] | Error>,
      held: number[] = [],
      folderStatus: (folders: string) => FolderStatus = folderStatuses()
    ) => {
      const releases = new Map<number, () => void>();
      mockSdk.cma.appActionCall.createWithResponse.mockImplementation(
        async (
          { appActionId }: { appActionId: string },
          { parameters }: { parameters: { offset?: number; folders?: string } }
        ) => {
          if (appActionId === GET_FOLDER_STATUS_APP_ACTION_ID) {
            return { response: { body: JSON.stringify(folderStatus(parameters.folders!)) } };
          }
          const offset = parameters.offset ?? 0;
          if (held.includes(offset)) {
            await new Promise<void>((resolve) => releases.set(offset, resolve));
          }
          const entry = pages[offset];
          const page = Array.isArray(entry) ? entry.shift() : entry;
          if (page instanceof Error) throw page;
          return { response: { body: JSON.stringify(page) } };
        }
      );
      return {
        release: async (offset: number) => {
          await waitFor(() => expect(releases.has(offset)).toBe(true));
          releases.get(offset)!();
        },
      };
    };

    const openDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
      const input = await waitForAutocomplete();
      await user.click(input);
      return input;
    };

    it('should request the first page without an offset and follow nextOffset until the last page', async () => {
      const user = userEvent.setup();
      mockPages({ 0: page1, 200: page2, 400: page3 });

      render(<Field />);
      await openDropdown(user);

      await waitFor(() => {
        expect(screen.getByText('Newsletter Signup')).toBeInTheDocument();
        expect(screen.getByText('EN Product Marketing')).toBeInTheDocument();
        expect(screen.getByText('EN Brand Invite')).toBeInTheDocument();
      });
      expect(requestedOffsets()).toEqual([undefined, 200, 400]);
    });

    it('should show the first page while later pages are still loading', async () => {
      const user = userEvent.setup();
      const pages = mockPages({ 0: page1, 200: page2, 400: page3 }, [200]);

      render(<Field />);
      await openDropdown(user);

      expect(screen.getByText('Newsletter Signup')).toBeInTheDocument();
      expect(screen.getByText(/Loading more Marketo forms/i)).toBeInTheDocument();

      await pages.release(200);

      await waitFor(() => {
        expect(screen.queryByText(/Loading more Marketo forms/i)).not.toBeInTheDocument();
      });
    });

    it('should apply the current search to forms that arrive later', async () => {
      const user = userEvent.setup();
      const pages = mockPages({ 0: page1, 200: page2, 400: page3 }, [200]);

      render(<Field />);
      const input = await openDropdown(user);
      await user.type(input, 'product');

      expect(screen.queryByText('Newsletter Signup')).not.toBeInTheDocument();

      await pages.release(200);

      await waitFor(() => {
        expect(screen.getByText('EN Product Marketing')).toBeInTheDocument();
      });
      expect(screen.queryByText('Newsletter Signup')).not.toBeInTheDocument();
      expect(screen.queryByText('EN Brand Invite')).not.toBeInTheDocument();
    });

    it('should display a saved form that is on a later page once it loads', async () => {
      mockSdk.field.getValue.mockReturnValue({
        id: 'form-4800',
        url: 'https://marketo.example.com/form-4800',
      });
      mockPages({ 0: page1, 200: page2, 400: page3 });

      render(<Field />);

      const input = await waitForAutocomplete();
      await waitFor(() => expect(input).toHaveValue('EN Product Marketing'));
    });

    it('should not re-select the saved form after the user cleared the field', async () => {
      const user = userEvent.setup();
      mockSdk.field.getValue.mockReturnValue({
        id: 'form-4800',
        url: 'https://marketo.example.com/form-4800',
      });
      const pages = mockPages({ 0: page1, 200: page2, 400: page3 }, [200]);

      render(<Field />);
      const input = await waitForAutocomplete();
      await user.type(input, 'x');
      await user.clear(input);

      await pages.release(200);

      await waitFor(() => {
        expect(screen.queryByText(/Loading more Marketo forms/i)).not.toBeInTheDocument();
      });
      expect(input).toHaveValue('');
    });

    it('should keep loaded forms and warn when a later page fails', async () => {
      const user = userEvent.setup();
      mockPages({ 0: page1, 200: new Error('Rate limited') });

      render(<Field />);
      await openDropdown(user);

      await waitFor(() => {
        expect(screen.getByText(/Some Marketo forms could not be loaded/i)).toBeInTheDocument();
      });
      expect(screen.getByText('Newsletter Signup')).toBeInTheDocument();
    });

    it('should keep loading instead of showing "no forms" when the first page is empty but more exist', async () => {
      const user = userEvent.setup();
      const pages = mockPages({ 0: { forms: [], nextOffset: 200 }, 200: page3 }, [200]);

      render(<Field />);

      await waitFor(() => expect(requestedOffsets()).toContain(200));
      expect(screen.queryByText(/No Marketo forms found/i)).not.toBeInTheDocument();

      await pages.release(200);

      await openDropdown(user);
      expect(screen.getByText('EN Brand Invite')).toBeInTheDocument();
    });

    it('should drop forms already loaded from an earlier page', async () => {
      const user = userEvent.setup();
      mockPages({
        0: page1,
        200: {
          forms: [form('form-1', 'Newsletter Signup'), form('form-4800', 'EN Product Marketing')],
        },
      });

      render(<Field />);
      await openDropdown(user);

      await waitFor(() => {
        expect(screen.getByText('EN Product Marketing')).toBeInTheDocument();
      });
      expect(screen.getAllByText('Newsletter Signup')).toHaveLength(1);
    });

    it('should show the load error when a later page fails before any forms loaded', async () => {
      mockPages({ 0: { forms: [], nextOffset: 200 }, 200: new Error('Rate limited') });

      render(<Field />);

      await waitFor(() => {
        expect(screen.getByText(FORM_ERROR_TEXT)).toBeInTheDocument();
      });
      expect(screen.queryByText(/No Marketo forms found/i)).not.toBeInTheDocument();
    });

    it('should stop paging when a page only repeats forms already loaded', async () => {
      mockPages({ 0: page1, 200: { ...page1, nextOffset: 400 }, 400: page3 });

      render(<Field />);
      await waitForAutocomplete();

      await waitFor(() => expect(requestedOffsets()).toEqual([undefined, 200]));
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(requestedOffsets()).toEqual([undefined, 200]);
    });

    it('should stop requesting pages after unmount', async () => {
      const pages = mockPages({ 0: page1, 200: page2, 400: page3 }, [200]);

      const { unmount } = render(<Field />);
      await waitForAutocomplete();
      unmount();
      await pages.release(200);

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(requestedOffsets()).toEqual([undefined, 200]);
    });

    describe('archived folders', () => {
      const inFolder = (f: FormObject, id: number) => ({
        ...f,
        folder: { id, type: 'Folder' as const },
      });
      const live = inFolder(form('form-1', 'Live Form'), 100);
      const old = inFolder(form('form-2', 'Old Form'), 25);

      it('should hide forms whose folder is archived', async () => {
        const user = userEvent.setup();
        mockPages({ 0: { forms: [live, old] } }, [], folderStatuses(['Folder:25']));

        render(<Field />);
        await openDropdown(user);

        expect(screen.getByText('Live Form')).toBeInTheDocument();
        expect(screen.queryByText('Old Form')).not.toBeInTheDocument();
      });

      it('should check each folder once across pages', async () => {
        mockPages({
          0: { forms: [live], nextOffset: 200 },
          200: { forms: [inFolder(form('form-3', 'Also Live'), 100), old] },
        });

        render(<Field />);

        await waitFor(() => expect(requestedFolders()).toEqual(['Folder:100', 'Folder:25']));
      });

      it('should check at most 10 folders per call', async () => {
        const forms = Array.from({ length: 12 }, (_, i) =>
          inFolder(form(`form-${i}`, `Form ${i}`), 1000 + i)
        );
        mockPages({ 0: { forms } });

        render(<Field />);

        await waitFor(() => expect(requestedFolders()).toHaveLength(2));
        expect(requestedFolders().map((folders) => String(folders).split(',').length)).toEqual([
          10, 2,
        ]);
      });

      // Loads once so folder status is saved, then forgets the calls it made.
      const completeFirstLoad = async () => {
        mockPages({ 0: { forms: [live] } });
        const first = render(<Field />);
        await waitForAutocomplete();
        first.unmount();
        mockSdk.cma.appActionCall.createWithResponse.mockClear();
      };

      it('should reuse folder status from an earlier load', async () => {
        await completeFirstLoad();

        render(<Field />);
        await waitForAutocomplete();

        expect(requestedFolders()).toEqual([]);
      });

      it('should check folders again once the saved status is a day old', async () => {
        await completeFirstLoad();
        const now = Date.now();
        vi.spyOn(Date, 'now').mockReturnValue(now + 25 * 60 * 60 * 1000);

        render(<Field />);

        await waitFor(() => expect(requestedFolders()).toEqual(['Folder:100']));
      });

      it('should not reuse folder status saved for another Marketo instance', async () => {
        await completeFirstLoad();
        mockSdk.parameters.installation = { munchkinId: 'other-instance' };

        render(<Field />);

        await waitFor(() => expect(requestedFolders()).toEqual(['Folder:100']));
      });
    });

    describe('rate limits', () => {
      const RATE_LIMIT_WAIT_MS = 20_000;
      const delays = () => vi.mocked(delay).mock.calls.map(([ms]) => ms);

      it('should wait and retry a rate-limited page', async () => {
        const user = userEvent.setup();
        mockPages({ 0: [{ rateLimited: true }, page1], 200: page2, 400: page3 });

        render(<Field />);
        await openDropdown(user);

        await waitFor(() => expect(screen.getByText('EN Brand Invite')).toBeInTheDocument());
        expect(screen.getByText('Newsletter Signup')).toBeInTheDocument();
        expect(delays()).toContain(RATE_LIMIT_WAIT_MS);
      });

      it('should retry only the folders that were rate limited', async () => {
        const user = userEvent.setup();
        const forms = [
          { ...form('form-1', 'First'), folder: { id: 100, type: 'Folder' as const } },
          { ...form('form-2', 'Second'), folder: { id: 101, type: 'Folder' as const } },
        ];
        const statuses = folderStatuses();
        let limited = false;
        mockPages({ 0: { forms } }, [], (folders) => {
          if (limited) return statuses(folders);
          limited = true;
          return { folders: statuses('Folder:100').folders, rateLimited: true };
        });

        render(<Field />);
        await openDropdown(user);

        await waitFor(() => expect(screen.getByText('Second')).toBeInTheDocument());
        expect(screen.getByText('First')).toBeInTheDocument();
        expect(requestedFolders()).toEqual(['Folder:100,Folder:101', 'Folder:101']);
      });

      it('should keep loaded forms and warn when Marketo keeps rate limiting', async () => {
        const user = userEvent.setup();
        const limited = Array.from({ length: 10 }, () => ({ rateLimited: true as const }));
        mockPages({ 0: page1, 200: limited });

        render(<Field />);
        await openDropdown(user);

        await waitFor(() => {
          expect(screen.getByText(/Some Marketo forms could not be loaded/i)).toBeInTheDocument();
        });
        expect(screen.getByText('Newsletter Signup')).toBeInTheDocument();
        expect(delays().filter((ms) => ms === RATE_LIMIT_WAIT_MS)).toHaveLength(3);
      });

      it('should space calls by the Marketo requests each one makes', async () => {
        const forms = [
          { ...form('form-1', 'First'), folder: { id: 100, type: 'Folder' as const } },
          { ...form('form-2', 'Second'), folder: { id: 101, type: 'Folder' as const } },
        ];
        mockPages({ 0: { forms } });

        render(<Field />);
        await waitForAutocomplete();

        // A page costs auth + forms.json; a folder batch costs auth + one per folder.
        await waitFor(() => expect(delays()).toEqual([1000, 1500]));
      });
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
