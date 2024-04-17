import React from 'react';
import { render } from '@testing-library/react';
import { mockContentTypes } from '../mocks/mockContentTypes';
import { mockContentTypePreviewPathSelections } from '../mocks/mockContentTypePreviewPathSelections';
import {
  ConfigPageContext,
  ChannelContextProviderProps,
} from '../../src/contexts/ConfigPageProvider';
import { AppInstallationParameters } from '../../src/customTypes/configPage';

export const renderConfigPageComponent = (
  children: React.ReactNode,
  overrides?: Partial<ChannelContextProviderProps>
) =>
  render(
    <ConfigPageContext.Provider
      value={{
        contentTypes: mockContentTypes,
        parameters: {
          contentTypePreviewPathSelections: mockContentTypePreviewPathSelections,
        } as AppInstallationParameters,
        dispatch: () => null,
        isAppConfigurationSaved: false,
        handleAppConfigurationChange: () => null,
        ...overrides,
      }}>
      {children}
    </ConfigPageContext.Provider>
  );
