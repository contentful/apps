import { createContext } from 'react';

export type ResourceFieldContextType = {
  isMultiple: boolean;
  handleAddResource: () => Promise<any[]>;
  handleAddContent: () => void;
  handleRemove: (index: number) => void;
  handleMoveToTop?: (index: number) => void;
  handleMoveToBottom?: (index: number) => void;
};

const ResourceFieldContext = createContext<ResourceFieldContextType>({
  isMultiple: false,
  handleAddResource: async () => [],
  handleAddContent: () => {},
  handleRemove: () => {},
});

export default ResourceFieldContext;
