import React from 'react';
import { mockContentTypes } from '../mocks/mockContentTypes';
import { mockContentTypePreviewPathSelections } from '../mocks/mockContentTypePreviewPathSelections';
import { ConfigPageContext } from '../../src/contexts/ConfigPageProvider';
import { AppInstallationParameters, Errors } from '../../src/customTypes/configPage';
import { initialErrors } from '@constants/defaultParams';

export const renderConfigPageHook = ({ children }: { children: React.ReactNode }) => (
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
    }}>
    {children}
  </ConfigPageContext.Provider>
);
