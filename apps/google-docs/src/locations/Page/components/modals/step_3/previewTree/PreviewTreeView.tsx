import React, { useMemo } from 'react';
import { Box } from '@contentful/f36-components';
import { PreviewEntry } from '../PreviewModal';
import { buildPreviewTree } from './buildPreviewTree';
import { PreviewTreeCard } from './components/PreviewTreeCard';
import { FlatTreeNode } from './types';

interface PreviewTreeViewProps {
  entries: PreviewEntry[];
}

/**
 * Tree view component to display entries and their references up to 3 levels deep.
 */
export const PreviewTreeView: React.FC<PreviewTreeViewProps> = ({ entries }) => {
  const flatNodes = buildPreviewTree(entries);

  // Enhance nodes with ancestor sibling information for proper line rendering
  const enhancedNodes = useMemo(() => {
    return flatNodes.map((node, index): FlatTreeNode => {
      // Determine if ancestors have siblings for proper vertical line rendering
      const ancestorHasSiblings: boolean[] = [];

      if (node.level > 0) {
        // Build the parent chain for this node
        const parentChain: string[] = [];
        let currentId = node.parentId;

        // Traverse up the parent chain
        while (currentId) {
          parentChain.unshift(currentId); // Add to front to get root->leaf order
          const parentNode = flatNodes.find((n) => n.id === currentId);
          currentId = parentNode?.parentId;
        }

        // For each ancestor in the chain, check if it has siblings
        parentChain.forEach((ancestorId, chainIndex) => {
          const ancestorNode = flatNodes.find((n) => n.id === ancestorId);
          if (!ancestorNode) {
            ancestorHasSiblings.push(false);
            return;
          }

          // Find the index of this ancestor
          const ancestorIndex = flatNodes.findIndex((n) => n.id === ancestorId);

          // Check if there are siblings after this ancestor (same level, same parent)
          let hasSiblings = false;
          for (let j = ancestorIndex + 1; j < flatNodes.length; j++) {
            const futureNode = flatNodes[j];

            // Stop if we've moved to a shallower level
            if (futureNode.level < ancestorNode.level) {
              break;
            }

            // Check if it's a sibling (same level and same parent)
            if (
              futureNode.level === ancestorNode.level &&
              futureNode.parentId === ancestorNode.parentId
            ) {
              hasSiblings = true;
              break;
            }
          }

          ancestorHasSiblings.push(hasSiblings);
        });
      }

      return {
        ...node,
        ancestorHasSiblings,
      };
    });
  }, [flatNodes]);

  // Determine if each node is the last child at its level
  const isLastChild = (index: number): boolean => {
    if (index >= enhancedNodes.length - 1) return true;

    const currentNode = enhancedNodes[index];
    const nextNode = enhancedNodes[index + 1];

    // It's the last child if the next node is at a lower or equal level
    return nextNode.level <= currentNode.level;
  };

  return (
    <Box marginBottom="spacingM">
      {enhancedNodes.map((node, index) => (
        <PreviewTreeCard key={node.id} node={node} isLastChild={isLastChild(index)} />
      ))}
    </Box>
  );
};
