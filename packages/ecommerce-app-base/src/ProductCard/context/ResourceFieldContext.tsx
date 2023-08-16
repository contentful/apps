import * as React from 'react';
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { ExternalResource } from '../types';

export type ResourceFieldContextType = {
  isMultiple: boolean;
  handleAddResource: () => Promise<ExternalResource[]>;
  handleRemove: (index?: number) => void;
  handleMoveToTop?: (index?: number) => void;
  handleMoveToBottom?: (index?: number) => void;
  logoUrl: string;
};

export const ResourceFieldContext = createContext<ResourceFieldContextType>({
  isMultiple: false,
  handleAddResource: async () => [],
  handleRemove: () => {},
  logoUrl: '',
});

export type ResourceFieldProviderProps = {
  isMultiple: boolean;
  handleAddResource: () => Promise<ExternalResource[]>;
  handleRemove: (index?: number) => void;
  handleMoveToTop?: (index?: number) => void;
  handleMoveToBottom?: (index?: number) => void;
  logoUrl: string;
  children: ReactNode;
};

export const ResourceFieldProvider = (props: ResourceFieldProviderProps) => {
  const {
    children,
    isMultiple,
    handleAddResource,
    handleRemove,
    handleMoveToTop,
    handleMoveToBottom,
    logoUrl,
  } = props;

  return (
    <ResourceFieldContext.Provider
      value={{
        isMultiple,
        handleAddResource,
        handleRemove,
        handleMoveToTop,
        handleMoveToBottom,
        logoUrl,
      }}>
      {children}
    </ResourceFieldContext.Provider>
  );
};

export const useResourceField = () => useContext(ResourceFieldContext);
