import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll } from 'vitest';
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
    vi.spyOn(VercelClient.prototype, 'checkToken').mockResolvedValue(true);
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

  it.only('renders the api paths sections once there a project has been selected', async () => {
    const { placeholder } = copies.configPage.projectSelectionSection;
    vi.spyOn(VercelClient.prototype, 'checkToken').mockResolvedValue({ ok: true });
    vi.spyOn(VercelClient.prototype, 'listProjects').mockResolvedValue({
      projects: [
        {
          id: '123',
          name: 'test',
          targets: {
            production: {
              id: '',
            },
          },
        },
      ],
    });
    const { unmount } = render(<ConfigScreen />);

    expect(await screen.findByText('Connect Vercel')).toBeTruthy();
    expect(screen.getByText('Vercel Access Token')).toBeTruthy();

    const input = screen.getByTestId('access-token');
    fireEvent.change(input, { target: { value: '12345' } });

    const projectSection = await screen.findByTestId(projectSelectionSectionTestId);
    expect(projectSection).toBeTruthy();

    const projectInput = screen.getByText(placeholder);
    expect(projectInput).toBeTruthy();
    fireEvent.click(projectInput);
    const options = document.querySelectorAll('option');
    // expect(option).toBeTruthy();

    fireEvent.click(options[0]);
    expect(await screen.findByTestId(pathSelectionSectionTestId)).toBeTruthy();
    // expect(screen.queryByTestId(pathSelectionSectionTestId)).toBeFalsy();
    // expect(screen.queryByTestId('content-type-preview-path-section')).toBeFalsy();
    unmount();
  });
});
