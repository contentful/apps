import { createContext } from 'react';

export type ResourceFieldContextType = {
  isMultiple: boolean;
  onAddContent: () => void;
  onRemove: (index: number) => void;
  onMoveToTop?: (index: number) => void;
  onMoveToBottom?: (index: number) => void;
};

const ResourceFieldContext = createContext<ResourceFieldContextType>({
  isMultiple: false,
  onAddContent: () => {},
  onRemove: () => {},
});

export default ResourceFieldContext;
