import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { AuthenticationSection } from './AuthenticationSection';
import { copies } from '@constants/copies';

const { input, invalidTokenMessage } = copies.configPage.authenticationSection;

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
        isTokenValid={false}
      />
    );

    const tokenInput = screen.getByPlaceholderText(input.placeholder);

    expect(tokenInput).toBeTruthy();
  });

  it('renders hidden token and valid content when token is valid', () => {
    const parameters = {
      vercelAccessToken: '12345',
      vercelAccessTokenStatus: 'valid',
    } as unknown as AppInstallationParameters;
    render(
      <AuthenticationSection handleTokenChange={vi.fn()} parameters={parameters} isTokenValid />
    );

    const token = screen.queryByText(parameters.vercelAccessToken);

    expect(token).toBeFalsy();
  });

  it('renders hidden token and invalid content when token is invalid', () => {
    const parameters = {
      vercelAccessToken: '12345',
      vercelAccessTokenStatus: 'valid',
    } as unknown as AppInstallationParameters;
    render(
      <AuthenticationSection
        handleTokenChange={vi.fn()}
        parameters={parameters}
        isTokenValid={false}
      />
    );

    const status = screen.getByText(invalidTokenMessage);
    const token = screen.queryByText(parameters.vercelAccessToken);

    expect(status).toBeTruthy();
    expect(token).toBeFalsy();
  });
});
