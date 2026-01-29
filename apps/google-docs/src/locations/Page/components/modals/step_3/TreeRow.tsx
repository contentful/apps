import React from 'react';
import { Flex } from '@contentful/f36-components';
import { css } from '@emotion/css';
import { TreeNode, isLastChild } from './tree-utils';
import { TreeIndentation } from './TreeIndentation';
import { EntryCard } from './EntryCard';

interface TreeRowProps {
  node: TreeNode;
  allNodes: TreeNode[];
}

export const TreeRow: React.FC<TreeRowProps> = ({ node, allNodes }) => {
  const isLast = isLastChild(node, allNodes);

  return (
    <Flex marginBottom="spacingS">
      <TreeIndentation node={node} isLastChild={isLast} allNodes={allNodes} />
      <EntryCard node={node} />
    </Flex>
  );
};
