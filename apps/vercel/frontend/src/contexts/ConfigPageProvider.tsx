import { createContext, Dispatch } from 'react';
import { ContentType } from '@contentful/app-sdk';
import { ParameterAction } from '@components/parameterReducer';
import { AppInstallationParameters } from '@customTypes/configPage';

interface ConfigPageContextValue {
  isAppConfigurationSaved: boolean;
  contentTypes: ContentType[];
  parameters: AppInstallationParameters;
  dispatch: Dispatch<ParameterAction>;
  handleAppConfigurationChange: () => void;
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
  } = props;

  return (
    <ConfigPageContext.Provider
      value={{
        isAppConfigurationSaved,
        contentTypes,
        dispatch,
        parameters,
        handleAppConfigurationChange,
      }}>
      {children}
    </ConfigPageContext.Provider>
  );
};
