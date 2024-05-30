import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppInstallationParameters } from '@customTypes/configPage';
import { ContentfulPreviewSecretSection } from './ContentfulPreviewSecretSection';
import { copies } from '@constants/copies';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';
import { mockSdk } from '@test/mocks';

const { input } = copies.configPage.contentfulPreviewSecretSection;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ContentfulPreviewSecretSection', () => {
  it('renders input with placeholder when secret is not yet inputed', () => {
    const parameters = {
      contentfulPreviewSecret: '',
    } as unknown as AppInstallationParameters;
    renderConfigPageComponent(
      <ContentfulPreviewSecretSection
        handleBlur={vi.fn()}
        handleChange={vi.fn()}
        handleRetry={vi.fn()}
      />,
      {
        parameters,
      }
    );

    const tokenInput = screen.getByPlaceholderText(input.placeholder);

    expect(tokenInput).toBeTruthy();
  });

  it('renders hidden secret and valid content when secret is valid', () => {
    const parameters = {
      contentfulPreviewSecret: '12345',
    } as unknown as AppInstallationParameters;
    renderConfigPageComponent(
      <ContentfulPreviewSecretSection
        handleBlur={vi.fn()}
        handleChange={vi.fn()}
        handleRetry={vi.fn()}
      />,
      {
        parameters,
      }
    );

    const secret = screen.queryByText(parameters.contentfulPreviewSecret);

    expect(secret).toBeFalsy();
  });

  // it('renders hidden token and invalid content when token is invalid', () => {
  //   const parameters = {
  //     vercelAccessToken: '12345',
  //   } as unknown as AppInstallationParameters;
  //   const errors = {
  //     ...initialErrors,
  //     authentication: {
  //       invalidToken: true,
  //       invalidTeamScope: false,
  //       expiredToken: false,
  //     },
  //   };
  //   renderConfigPageComponent(
  //     <AuthenticationSection handleTokenChange={vi.fn()} />,
  //     {
  //       parameters,
  //       errors,
  //     }
  //   );

  //   const status = screen.getByText(errorMessages.invalidToken);
  //   const token = screen.queryByText(parameters.vercelAccessToken);

  //   expect(status).toBeTruthy();
  //   expect(token).toBeFalsy();
  // });
});
