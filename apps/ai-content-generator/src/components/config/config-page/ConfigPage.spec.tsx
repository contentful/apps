import ConfigPage from './ConfigPage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigErrors, Sections } from '@components/config/configText';
import { defaultModelId } from '@configs/ai/gptModels';
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';
import { render, screen } from '@testing-library/react';
import { mockCma, MockSdk } from '../../../../test/mocks';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

// Point both the reducer source (getParameters) and the raw read the soft-check
// uses (parameters.installation) at the same installation params, then render.
const renderWithInstallation = (installation: PersistedInstallationParameters) => {
  sdk.parameters.installation = installation;
  sdk.app.getParameters = vi.fn().mockResolvedValue(installation);
  return render(<ConfigPage />);
};

// The config save flow registers a callback via sdk.app.onConfigure; invoking
// the captured callback is how the web app triggers validation on "Save".
const runConfigure = async () => {
  const configure = sdk.app.onConfigure.mock.calls.at(-1)?.[0];
  return configure ? await configure() : undefined;
};

describe('ConfigPage component', () => {
  beforeEach(() => {
    mockSdk.reset();
  });

  it('renders the correct sections', async () => {
    render(<ConfigPage />);

    const configTitle = screen.getByText(Sections.configHeading);
    const brandTitle = screen.getByText(Sections.brandHeading);
    const sidebarTitle = screen.getByText(Sections.addToSidebarHeading);

    expect(configTitle).toBeTruthy();
    expect(brandTitle).toBeTruthy();
    expect(sidebarTitle).toBeTruthy();
  });

  it('blocks a first-time save when no key is stored and none was entered', async () => {
    renderWithInstallation({ model: defaultModelId, profile: '' });

    const result = await runConfigure();

    expect(result).toBe(false);
    expect(sdk.notifier.error).toHaveBeenCalledWith(
      `${ConfigErrors.failedToSave} ${ConfigErrors.missingApiKey}`
    );
  });

  it('allows a re-save with a blank key field when a Secret is already stored', async () => {
    // The stored Secret reads back as a masked, non-empty value.
    renderWithInstallation({ model: defaultModelId, profile: '', key: '***' });

    const result = await runConfigure();

    expect(result).not.toBe(false);
    expect(sdk.notifier.error).not.toHaveBeenCalledWith(
      `${ConfigErrors.failedToSave} ${ConfigErrors.missingApiKey}`
    );
  });
});
