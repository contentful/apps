import React from 'react';
import { render } from '@testing-library/react';
import { mockContentTypes } from '../mocks/mockContentTypes';
import { mockContentTypePreviewPathSelections } from '../mocks/mockContentTypePreviewPathSelections';
import { ConfigPageContext } from '../../src/contexts/ConfigPageProvider';
import { AppInstallationParameters, Errors } from '../../src/customTypes/configPage';
import { initialErrors } from '@constants/defaultParams';

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
        ...overrides,
      }}>
      {children}
    </ConfigPageContext.Provider>
  );
