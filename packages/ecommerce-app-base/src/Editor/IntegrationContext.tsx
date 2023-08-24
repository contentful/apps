import type { PropsWithChildren } from 'react';
import React, { createContext, useContext } from 'react';
import type { Integration } from '../types';
import { Product } from '../types';

// eslint-disable-next-line
export const IntegrationContext = createContext<Integration<any>>({} as Integration<any>);

type Props<P extends Product = Product> = PropsWithChildren<{ integration: Integration<P> }>;

export function IntegrationProvider<P extends Product = Product>({
  integration,
  children,
}: Props<P>) {
  return <IntegrationContext.Provider value={integration}>{children}</IntegrationContext.Provider>;
}

export const useIntegration = <P extends Product = Product>(): Integration<P> => {
  return useContext(IntegrationContext) as unknown as Integration<P>;
};

/* let's see if we need it ...
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
 */
