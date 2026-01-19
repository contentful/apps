import { EntryProps } from 'contentful-management';

export interface TreeNode {
  entryId: string;
  entry: EntryProps;
  contentTypeId: string;
  displayName: string;
  internalName: string;
  isAsset: boolean;
  children: TreeNode[];
  isMorePlaceholder?: boolean; // Indicates this is a "+more" placeholder for items beyond level 10
}

export interface ReferencesTreeProps {
  referencesTree: Record<string, EntryProps>;
  parentEntryId: string;
  cma?: any;
  onSelectedIdsChange?: (_selectedIds: Set<string>) => void;
  listBlockContentIds?: string[];
}
