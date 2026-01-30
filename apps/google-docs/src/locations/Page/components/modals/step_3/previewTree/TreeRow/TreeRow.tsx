import React from 'react';
import { Flex } from '@contentful/f36-components';
import { TreeNode, isLastChild } from '../tree-utils';
import { Indentation } from '../Indentation/Indentation';
import { EntryCard } from '../EntryCard/EntryCard';

interface TreeRowProps {
  node: TreeNode;
  allNodes: TreeNode[];
}

export const TreeRow: React.FC<TreeRowProps> = ({ node, allNodes }) => {
  const isLast = isLastChild(node, allNodes);

  return (
    <Flex marginBottom="spacingS">
      <Indentation node={node} isLastChild={isLast} allNodes={allNodes} />
      <EntryCard node={node} />
    </Flex>
  );
};
