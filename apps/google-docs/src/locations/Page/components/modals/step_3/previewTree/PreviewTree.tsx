import { useMemo } from 'react';
import { Box } from '@contentful/f36-components';
import { PreviewEntry, buildEntryTree, flattenTree } from './tree-utils';
import { TreeRow } from './TreeRow/TreeRow';

interface PreviewTreeProps {
  previewEntries: PreviewEntry[];
}

export const PreviewTree = ({ previewEntries }: PreviewTreeProps) => {
  const treeNodes = useMemo(() => {
    if (!previewEntries || previewEntries.length === 0) {
      return [];
    }

    const tree = buildEntryTree(previewEntries);
    return flattenTree(tree);
  }, [previewEntries]);

  return (
    <Box marginBottom="spacingM">
      {treeNodes.map((node, index) => (
        <TreeRow key={`${node.id}-${index}`} node={node} allNodes={treeNodes} />
      ))}
    </Box>
  );
};
