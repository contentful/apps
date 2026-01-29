import { PreviewEntry } from '../PreviewModal';

export interface TreeNode {
  id: string;
  entry: PreviewEntry['entry'];
  title: string;
  contentTypeName: string;
  level: number;
  references: TreeNode[];
}

export interface FlatTreeNode {
  id: string;
  entry: PreviewEntry['entry'];
  title: string;
  contentTypeName: string;
  level: number;
  parentId?: string;
  ancestorHasSiblings?: boolean[];
}
