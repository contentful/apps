import {
  EntryToCreate,
  isReference,
  isReferenceArray,
} from '../../../../../../../../functions/agents/documentParserAgent/schema';

export interface PreviewEntry {
  entry: EntryToCreate;
  title: string;
  contentTypeName: string;
}

export interface TreeNode {
  id: string;
  tempId?: string;
  contentTypeId: string;
  title: string;
  contentTypeName: string;
  entry: EntryToCreate;
  children: TreeNode[];
  level: number;
  path: string[];
  hasChildren: boolean;
  isCircular?: boolean;
}

/**
 * Extracts all reference tempIds from an entry's fields
 */
export function extractReferences(entry: EntryToCreate): string[] {
  const referenceTempIds: string[] = [];

  Object.values(entry.fields).forEach((localizedField) => {
    Object.values(localizedField).forEach((fieldValue) => {
      if (isReference(fieldValue)) {
        referenceTempIds.push(fieldValue.__ref);
      } else if (isReferenceArray(fieldValue)) {
        fieldValue.forEach((ref) => referenceTempIds.push(ref.__ref));
      }
    });
  });

  return referenceTempIds;
}

/**
 * Flattens tree into a list for rendering
 */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];

  function traverse(node: TreeNode) {
    result.push(node);
    node.children.forEach((child) => traverse(child));
  }

  nodes.forEach((node) => traverse(node));
  return result;
}
