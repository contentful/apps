import NotificationsSection from './NotificationsSection';
import { describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { notificationsSection } from '@constants/configCopy';
import { mockSdk } from '@test/mocks';
import useGetContentTypes from '@hooks/useGetContentTypes';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('NotificationsSection component', () => {
  it('mounts with title and button', () => {
    renderHook(() => useGetContentTypes());
    render(<NotificationsSection notifications={[]} dispatch={vi.fn()} />);

    expect(screen.getByText(notificationsSection.title)).toBeTruthy();
    expect(screen.getByText(notificationsSection.createButton)).toBeTruthy();
  });
});
