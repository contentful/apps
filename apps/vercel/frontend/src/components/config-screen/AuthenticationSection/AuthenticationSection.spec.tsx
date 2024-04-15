import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { AuthenticationSection } from './AuthenticationSection';
import { copies } from '@constants/copies';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';

const { input } = copies.configPage.authenticationSection;

describe('AuthenticationSection', () => {
  it('renders input when token is not yet inputed', () => {
    const parameters = {
      vercelAccessToken: '',
    } as unknown as AppInstallationParameters;
    renderConfigPageComponent(
      <AuthenticationSection handleTokenChange={vi.fn()} isTokenValid={false} />,
      { parameters }
    );

    const tokenInput = screen.getByPlaceholderText(input.placeholder);

    expect(tokenInput).toBeTruthy();
  });

  it('renders hidden token and valid content when token is valid', () => {
    const parameters = {
      vercelAccessToken: '12345',
    } as unknown as AppInstallationParameters;
    renderConfigPageComponent(<AuthenticationSection handleTokenChange={vi.fn()} isTokenValid />, {
      parameters,
    });

    const token = screen.queryByText(parameters.vercelAccessToken);

    expect(token).toBeFalsy();
  });

  it('renders hidden token and invalid content when token is invalid', () => {
    const parameters = {
      vercelAccessToken: '12345',
    } as unknown as AppInstallationParameters;
    renderConfigPageComponent(
      <AuthenticationSection handleTokenChange={vi.fn()} isTokenValid={false} />,
      { parameters }
    );

    const status = screen.getByText(input.errorMessage);
    const token = screen.queryByText(parameters.vercelAccessToken);

    expect(status).toBeTruthy();
    expect(token).toBeFalsy();
  });
});
