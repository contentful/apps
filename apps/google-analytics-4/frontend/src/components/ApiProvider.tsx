import { useCMA } from '@contentful/react-apps-toolkit';
import { createContext, PropsWithChildren } from 'react';
import { Api } from '../services/api';

export const ApiContext = createContext<{ api: Api | null }>({ api: null });

export interface ApiProviderProps {}

export const ApiProvider = (props: PropsWithChildren<ApiProviderProps>) => {
  const cma = useCMA();
  const api = new Api('service_key', cma);
  return <ApiContext.Provider value={{ api }}>{props.children}</ApiContext.Provider>;
};
