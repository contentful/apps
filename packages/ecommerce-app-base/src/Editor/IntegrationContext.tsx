import type { ComponentType, FC, PropsWithChildren } from 'react';
import React, { createContext, useContext } from 'react';
import { Integration } from '../interfaces';

export const IntegrationContext = createContext({} as Integration);

type Props = PropsWithChildren<{ integration: Integration }>;

export const IntegrationProvider: FC<Props> = ({ integration, children }) => {
  return <IntegrationContext.Provider value={integration}>{children}</IntegrationContext.Provider>;
};

export const useIntegration = (): Integration => {
  return useContext(IntegrationContext);
};

export function withIntegrationContext<T extends Partial<Integration> = {}>(
  WrappedComponent: ComponentType<T>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithContext = (props: Omit<T, keyof Integration>) => {
    const context = useIntegration();
    return <WrappedComponent {...context} {...(props as T)} />;
  };

  ComponentWithContext.displayName = `withIntegrationContext(${displayName})`;
  return ComponentWithContext;
}
