import type { FC, PropsWithChildren } from 'react';
import React, { createContext, useContext } from 'react';
import { Integration } from '../interfaces';

// eslint-disable-next-line
export const IntegrationContext = createContext<Integration>({} as Integration);

type Props = PropsWithChildren<{ integration: Integration }>;

export const IntegrationProvider: FC<Props> = ({ integration, children }) => {
  return <IntegrationContext.Provider value={integration}>{children}</IntegrationContext.Provider>;
};

export const useIntegration = (): Integration => {
  return useContext(IntegrationContext);
};
