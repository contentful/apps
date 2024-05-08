import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import userEvent from '@testing-library/user-event';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from './ConfigScreen';
import VercelClient from '@clients/Vercel';
import { singleSelectionSections } from '@constants/enums';
import { copies } from '@constants/copies';

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
    vi.spyOn(VercelClient.prototype, 'checkToken').mockResolvedValue({
      ok: true,
      data: { id: 'team-id', name: 'token-name', expiresAt: '', teamId: '12345' },
    });
    vi.spyOn(VercelClient.prototype, 'listProjects').mockResolvedValue({
      projects: [
        {
          id: 'project-1',
          name: 'Project 1',
          targets: {
            production: {
              id: '',
            },
          },
          protectionBypass: {},
          env: [],
        },
      ],
    });
    vi.spyOn(VercelClient.prototype, 'listApiPaths').mockResolvedValue([
      { id: 'api-path-1', name: 'Api Path 1' },
    ]);
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

  it('renders the sections sequentially', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ConfigScreen />);

    expect(await screen.findByText('Connect Vercel')).toBeTruthy();
    expect(screen.getByText('Vercel Access Token')).toBeTruthy();

    const input = screen.getByTestId('access-token');
    fireEvent.change(input, { target: { value: '12345' } });

    const projectSection = await screen.findByTestId(projectSelectionSectionTestId);
    expect(projectSection).toBeTruthy();
    expect(screen.queryByTestId(pathSelectionSectionTestId)).toBeFalsy();
    expect(screen.queryByTestId('content-type-preview-path-section')).toBeFalsy();

    const selectDropdowns = await screen.findAllByTestId('optionsSelect');
    const dropdownPlaceholder = await screen.findByText(
      copies.configPage.projectSelectionSection.placeholder
    );
    expect(dropdownPlaceholder).toBeTruthy();

    user.selectOptions(selectDropdowns[0], 'Project 1');

    const apiPathSection = await screen.findByTestId(pathSelectionSectionTestId);
    expect(apiPathSection).toBeTruthy();

    const updatedSelectDropdowns = await screen.findAllByTestId('optionsSelect');
    user.selectOptions(updatedSelectDropdowns[1], 'Api Path 1');

    expect(await screen.findByTestId('content-type-preview-path-section')).toBeTruthy();
    unmount();
  });
});
