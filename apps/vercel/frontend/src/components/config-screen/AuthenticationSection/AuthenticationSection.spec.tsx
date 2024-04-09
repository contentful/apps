import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { AuthenticationSection } from './AuthenticationSection';
import { copies } from '@constants/copies';

const { input, statusMessages } = copies.configPage.authenticationSection;

describe('AuthenticationSection', () => {
  it('renders input when token is not yet inputed', () => {
    const parameters = {
      vercelAccessToken: '',
      vercelAccessTokenStatus: '',
    } as unknown as AppInstallationParameters;
    render(
      <AuthenticationSection
        handleTokenChange={vi.fn()}
        parameters={parameters}
        isAppInstalled={false}
      />
    );

    const status = screen.getByText(statusMessages.invalid);
    const tokenInput = screen.getByPlaceholderText(input.placeholder);

    expect(status).toBeTruthy();
    expect(tokenInput).toBeTruthy();
  });

  it('renders hidden token and valid content when token is valid and app is installed', () => {
    const parameters = {
      vercelAccessToken: '12345',
      vercelAccessTokenStatus: 'valid',
    } as unknown as AppInstallationParameters;
    render(
      <AuthenticationSection handleTokenChange={vi.fn()} parameters={parameters} isAppInstalled />
    );

    const status = screen.getByText(statusMessages.valid);
    const token = screen.queryByText(parameters.vercelAccessToken);

    expect(status).toBeTruthy();
    expect(token).toBeFalsy();
  });
});
