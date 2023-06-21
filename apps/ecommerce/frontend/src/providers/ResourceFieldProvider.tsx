import ResourceFieldContext from 'context/ResourceFieldContext';
import { ReactNode } from 'react';

export type ResourceFieldProviderProps = {
  isMultiple: boolean;
  handleAddResource: () => Promise<any[]>;
  handleRemove: (index?: number) => void;
  handleMoveToTop?: (index?: number) => void;
  handleMoveToBottom?: (index?: number) => void;
  logoUrl: string;
  children: ReactNode;
};

const ResourceFieldProvider = (props: ResourceFieldProviderProps) => {
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

export default ResourceFieldProvider;
