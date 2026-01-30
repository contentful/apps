import React from 'react';
import { Flex } from '@contentful/f36-components';
import { TreeNode, isLeafNode } from '../tree-utils';
import { Indentation } from '../Indentation/Indentation';
import { EntryCard } from '../EntryCard/EntryCard';

interface TreeRowProps {
  node: TreeNode;
  allNodes: TreeNode[];
}

export const TreeRow: React.FC<TreeRowProps> = ({ node, allNodes }) => {
  const isLeaf = isLeafNode(node, allNodes);

  return (
    <Flex marginBottom="spacingS">
      <Indentation node={node} isLeafNode={isLeaf} allNodes={allNodes} />
      <EntryCard node={node} />
    </Flex>
  );
};
