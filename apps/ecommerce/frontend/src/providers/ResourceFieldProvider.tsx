import ResourceFieldContext from 'context/ResourceFieldContext';
import useResourceValue from 'hooks/field/useResourceValue';
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
  const { value } = useResourceValue(isMultiple);

  return (
    <ResourceFieldContext.Provider
      value={{
        resourceArray: value,
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
