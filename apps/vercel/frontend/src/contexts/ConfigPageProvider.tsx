import { createContext, Dispatch } from 'react';
import { ContentType } from '@contentful/app-sdk';
import { ParameterAction } from '@components/parameterReducer';
import { AppInstallationParameters } from '@customTypes/configPage';

interface ConfigPageContextValue {
  isAppConfigureCalled: boolean;
  contentTypes: ContentType[];
  parameters: AppInstallationParameters;
  dispatch: Dispatch<ParameterAction>;
  clearIsAppConfigureCalled: () => void;
}

export interface ChannelContextProviderProps {
  children: React.ReactNode;
  isAppConfigureCalled: boolean;
  contentTypes: ContentType[];
  parameters: AppInstallationParameters;
  dispatch: Dispatch<ParameterAction>;
  clearIsAppConfigureCalled: () => void;
}

export const ConfigPageContext = createContext({} as ConfigPageContextValue);

export const ConfigPageProvider = (props: ChannelContextProviderProps) => {
  const {
    children,
    isAppConfigureCalled,
    contentTypes,
    dispatch,
    parameters,
    clearIsAppConfigureCalled,
  } = props;

  return (
    <ConfigPageContext.Provider
      value={{
        isAppConfigureCalled,
        contentTypes,
        dispatch,
        parameters,
        clearIsAppConfigureCalled,
      }}>
      {children}
    </ConfigPageContext.Provider>
  );
};
