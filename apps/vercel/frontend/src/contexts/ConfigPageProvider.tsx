import { createContext, Dispatch } from 'react';
import { ContentType } from '@contentful/app-sdk';
import { ParameterAction } from '@reducers/parameterReducer';
import { AppInstallationParameters } from '@customTypes/configPage';

interface ConfigPageContextValue {
  isAppConfigurationSaved: boolean;
  contentTypes: ContentType[];
  parameters: AppInstallationParameters;
  dispatch: Dispatch<ParameterAction>;
  handleAppConfigurationChange: () => void;
  isLoading: boolean;
}

export interface ChannelContextProviderProps extends ConfigPageContextValue {
  children: React.ReactNode;
}

export const ConfigPageContext = createContext({} as ConfigPageContextValue);

export const ConfigPageProvider = (props: ChannelContextProviderProps) => {
  const {
    children,
    isAppConfigurationSaved,
    contentTypes,
    dispatch,
    parameters,
    handleAppConfigurationChange,
    isLoading,
  } = props;

  return (
    <ConfigPageContext.Provider
      value={{
        isAppConfigurationSaved,
        contentTypes,
        dispatch,
        parameters,
        handleAppConfigurationChange,
        isLoading,
      }}>
      {children}
    </ConfigPageContext.Provider>
  );
};
