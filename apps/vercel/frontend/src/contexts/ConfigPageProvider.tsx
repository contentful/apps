import { createContext, Dispatch } from 'react';
import { ConfigAppSDK, ContentType } from '@contentful/app-sdk';
import { ParameterAction } from '@reducers/parameterReducer';
import { AppInstallationParameters, Errors } from '@customTypes/configPage';
import { ErrorAction } from '@reducers/errorsReducer';
import VercelClient from '@clients/Vercel';

interface ConfigPageContextValue {
  isAppConfigurationSaved: boolean;
  contentTypes: ContentType[];
  parameters: AppInstallationParameters;
  errors: Errors;
  dispatchParameters: Dispatch<ParameterAction>;
  dispatchErrors: Dispatch<ErrorAction>;
  handleAppConfigurationChange: () => void;
  isLoading: boolean;
  sdk: ConfigAppSDK;
  vercelClient: VercelClient | null;
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
    dispatchParameters,
    dispatchErrors,
    parameters,
    errors,
    handleAppConfigurationChange,
    isLoading,
    sdk,
    vercelClient,
  } = props;

  return (
    <ConfigPageContext.Provider
      value={{
        isAppConfigurationSaved,
        contentTypes,
        dispatchParameters,
        dispatchErrors,
        parameters,
        errors,
        handleAppConfigurationChange,
        isLoading,
        sdk,
        vercelClient,
      }}>
      {children}
    </ConfigPageContext.Provider>
  );
};
