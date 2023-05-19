import { createContext } from 'react';
import type { ExternalResourceLink } from 'types';

export type ResourceFieldContextType = {
  resourceArray: ExternalResourceLink[];
  isMultiple: boolean;
  onAddContent: () => void;
  onRemove: (index: number) => void;
  onMoveToTop?: (index: number) => void;
  onMoveToBottom?: (index: number) => void;
};

const ResourceFieldContext = createContext<ResourceFieldContextType>({
  resourceArray: [],
  isMultiple: false,
  onAddContent: () => {},
  onRemove: () => {},
});

export default ResourceFieldContext;
