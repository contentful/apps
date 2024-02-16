import ConfigPage from './ConfigPage';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { mockSdk } from '@test/mocks';
import { headerSection, notificationsSection } from '@constants/configCopy';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('@azure/msal-react', () => ({
  useMsal: vi.fn().mockReturnValue({ accounts: [{ asdf: 'asdf' }] }),
}));

vi.mock('@components/config/AccessSection/AccessSection', () => ({
  default: () => {
    return <div>Mock Access Section</div>;
  },
}));

vi.mock('@components/config/NotificationsSection/NotificationsSection', () => ({
  default: ({ setNotificationIndexToEdit }: { setNotificationIndexToEdit: any }) => {
    return (
      <>
        <h1>MOCKED NOTIFICATIONS!!!!!</h1>
        <button
          onClick={() => {
            setNotificationIndexToEdit(0);
          }}
          data-testid="edit-notification-btn">
          edit
        </button>
      </>
    );
  },
}));

describe('ConfigPage component', () => {
  it('mounts and renders title', () => {
    const { unmount } = render(<ConfigPage />);

    expect(screen.getByText(headerSection.title)).toBeTruthy();

    unmount();
  });

  describe('Saving via WidgetRenderer', () => {
    it('prompts the User to save or cancel their pending changes when they have an open Notification modal', async () => {
      const { unmount } = render(<ConfigPage />);

      // Open an existing notification to edit it, i.e. pending change
      let editButton;
      await waitFor(() => {
        // waitFor async callbacks to resolve inside useEffects
        editButton = screen.getByTestId('edit-notification-btn');
        return !!editButton;
      });

      // @ts-ignore
      // this will put <ConfigPage> in a state with pending changes. i.e. User has opened notification to be editted.
      fireEvent.click(editButton);

      // Mimic user clicking "Save" button in top right of widget Renderer
      const response = await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
      const pendingChangesModal = screen.getByText(
        notificationsSection.pendingChangesModal.areYouSure
      );

      expect(pendingChangesModal).toBeDefined();
      expect(response).toEqual(false);

      unmount();
    });
  });
});
