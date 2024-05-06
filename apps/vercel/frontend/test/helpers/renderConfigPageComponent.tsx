import React from 'react';
import { render } from '@testing-library/react';
import { mockContentTypes } from '../mocks/mockContentTypes';
import { mockContentTypePreviewPathSelections } from '../mocks/mockContentTypePreviewPathSelections';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { AppInstallationParameters, Errors } from '@customTypes/configPage';
import { initialErrors } from '@constants/defaultParams';
import { mockSdk } from '@test/mocks';

export const renderConfigPageComponent = (
  children: React.ReactNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overrides?: any
) =>
  render(
    <ConfigPageContext.Provider
      value={{
        contentTypes: mockContentTypes,
        parameters: {
          contentTypePreviewPathSelections: mockContentTypePreviewPathSelections,
        } as AppInstallationParameters,
        errors: {
          ...initialErrors,
        } as Errors,
        dispatchParameters: () => null,
        dispatchErrors: () => null,
        isAppConfigurationSaved: false,
        handleAppConfigurationChange: () => null,
        isLoading: false,
        sdk: mockSdk,
        vercelClient: null,
        ...overrides,
      }}>
      {children}
    </ConfigPageContext.Provider>
  );
