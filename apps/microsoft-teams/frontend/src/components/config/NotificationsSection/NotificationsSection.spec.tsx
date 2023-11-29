import NotificationsSection from './NotificationsSection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notificationsSection } from '@constants/configCopy';
import { mockSdk, mockGetManyContentType } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useGetContentTypes: () => mockGetManyContentType,
  useGetLinkForContentTypeConfig: () => '',
}));

describe('NotificationsSection component', () => {
  it('mounts with title and button', () => {
    render(<NotificationsSection notifications={[]} dispatch={vi.fn()} />);

    expect(screen.getByText(notificationsSection.title)).toBeTruthy();
    expect(screen.getByText(notificationsSection.createButton)).toBeTruthy();
  });
});
