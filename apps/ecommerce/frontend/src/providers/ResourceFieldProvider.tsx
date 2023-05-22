import ResourceFieldContext from 'context/ResourceFieldContext';
import { ReactNode } from 'react';

export type ResourceFieldProviderProps = {
  isMultiple: boolean;
  onAddContent: () => void;
  onRemove: (index: number) => void;
  onMoveToTop?: (index: number) => void;
  onMoveToBottom?: (index: number) => void;
  children: ReactNode;
};

const ResourceFieldProvider = ({
  children,
  isMultiple,
  onAddContent,
  onRemove,
  onMoveToTop,
  onMoveToBottom,
}: ResourceFieldProviderProps) => {
  return (
    <ResourceFieldContext.Provider
      value={{
        isMultiple,
        onAddContent,
        onRemove,
        onMoveToTop,
        onMoveToBottom,
      }}>
      {children}
    </ResourceFieldContext.Provider>
  );
};

export default ResourceFieldProvider;
