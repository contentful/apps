import ResourceFieldContext from 'context/ResourceFieldContext';
import { ReactNode } from 'react';

export type ResourceFieldProviderProps = {
  isMultiple: boolean;
  handleAddContent: () => void;
  handleAddResource: () => Promise<any[]>;
  handleRemove: (index: number) => void;
  handleMoveToTop?: (index: number) => void;
  handleMoveToBottom?: (index: number) => void;
  children: ReactNode;
};

const ResourceFieldProvider = (props: ResourceFieldProviderProps) => {
  const {
    children,
    isMultiple,
    handleAddResource,
    handleAddContent,
    handleRemove,
    handleMoveToTop,
    handleMoveToBottom,
  } = props;

  return (
    <ResourceFieldContext.Provider
      value={{
        isMultiple,
        handleAddResource,
        handleAddContent,
        handleRemove,
        handleMoveToTop,
        handleMoveToBottom,
      }}>
      {children}
    </ResourceFieldContext.Provider>
  );
};

export default ResourceFieldProvider;
