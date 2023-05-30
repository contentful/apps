import ResourceFieldContext from 'context/ResourceFieldContext';
import { ReactNode } from 'react';

export type ResourceFieldProviderProps = {
  isMultiple: boolean;
  handleAddContent: () => void;
  handleRemove: (index: number) => void;
  handleMoveToTop?: (index: number) => void;
  handleMoveToBottom?: (index: number) => void;
  children: ReactNode;
};

const ResourceFieldProvider = (props: ResourceFieldProviderProps) => {
  const {
    children,
    isMultiple,
    handleAddContent,
    handleRemove,
    handleMoveToTop,
    handleMoveToBottom,
  } = props;

  return (
    <ResourceFieldContext.Provider
      value={{
        isMultiple,
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
