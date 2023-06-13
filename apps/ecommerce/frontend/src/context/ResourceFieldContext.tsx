import { createContext } from 'react';

export type ResourceFieldContextType = {
  isMultiple: boolean;
  handleAddResource: () => Promise<any[]>;
  handleRemove: (index: number) => void;
  handleMoveToTop?: (index: number) => void;
  handleMoveToBottom?: (index: number) => void;
  logoUrl: string;
};

const ResourceFieldContext = createContext<ResourceFieldContextType>({
  isMultiple: false,
  handleAddResource: async () => [],
  handleRemove: () => {},
  logoUrl: '',
});

export default ResourceFieldContext;
