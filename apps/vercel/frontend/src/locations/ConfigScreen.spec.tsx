import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from './ConfigScreen';
import VercelClient from '@clients/Vercel';
import { singleSelectionSections } from '@constants/enums';

const projectSelectionSectionTestId = singleSelectionSections.PROJECT_SELECTION_SECTION;
const pathSelectionSectionTestId = singleSelectionSections.API_PATH_SELECTION_SECTION;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('ConfigScreen', () => {
  beforeAll(() => {
    mockSdk.cma.contentType.getMany = vi.fn().mockResolvedValue({ items: [] });
  });
  it('renders only authentication section on mount', async () => {
    const { unmount } = render(<ConfigScreen />);

    expect(await screen.findByText('Connect Vercel')).toBeTruthy();
    expect(screen.getByText('Vercel Access Token')).toBeTruthy();
    expect(screen.queryByTestId(projectSelectionSectionTestId)).toBeFalsy();
    expect(screen.queryByTestId(pathSelectionSectionTestId)).toBeFalsy();
    expect(screen.queryByTestId('content-type-preview-path-section')).toBeFalsy();
    unmount();
  });

  it('renders the project sections once there is a valid token', async () => {
    vi.spyOn(VercelClient.prototype, 'checkToken').mockResolvedValue({ ok: true });
    const { unmount } = render(<ConfigScreen />);

    expect(await screen.findByText('Connect Vercel')).toBeTruthy();
    expect(screen.getByText('Vercel Access Token')).toBeTruthy();

    const input = screen.getByTestId('access-token');
    fireEvent.change(input, { target: { value: '12345' } });

    const projectSection = await screen.findByTestId(projectSelectionSectionTestId);
    expect(projectSection).toBeTruthy();
    expect(screen.queryByTestId(pathSelectionSectionTestId)).toBeFalsy();
    expect(screen.queryByTestId('content-type-preview-path-section')).toBeFalsy();
    unmount();
  });
});
