import NotificationsSection from './NotificationsSection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notificationsSection } from '@constants/configCopy';
import { mockSdk, mockCustomApi } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('@hooks/useCustomApi', () => ({
  useCustomApi: () => mockCustomApi,
}));

describe('NotificationsSection component', () => {
  it('mounts with title and button', () => {
    render(
      <NotificationsSection
        notifications={[]}
        dispatch={vi.fn()}
        setNotificationIndexToEdit={vi.fn()}
        notificationIndexToEdit={null}
      />
    );

    expect(screen.getByText(notificationsSection.title)).toBeTruthy();
    expect(screen.getByText(notificationsSection.createButton)).toBeTruthy();
  });
});
