import React from 'react';
import { cx } from '@emotion/css';
import { TreeNode } from '../tree-utils';
import { indentationStyles as styles } from './Indentation.styles';

interface IndentationProps {
  node: TreeNode;
  allNodes: TreeNode[];
}

function getAncestorCount(node: TreeNode): number {
  // Level 0 = root, no indentation
  // Level 1 = 0 ancestors (direct children of root)
  // Level 2 = 1 ancestor, etc.
  return Math.max(0, node.level - 1);
}

/**
 * Check if a node is the last child among its siblings
 */
function isLastChild(node: TreeNode, allNodes: TreeNode[]): boolean {
  if (node.level === 0) return true;

  const parentPath = node.path.slice(0, -1);
  const siblings = allNodes.filter(
    (n) => n.level === node.level && n.path.slice(0, -1).join('/') === parentPath.join('/')
  );

  return siblings[siblings.length - 1]?.id === node.id;
}

//Check if an ancestor at a given level is the last child
function isAncestorLastChild(node: TreeNode, ancestorLevel: number, allNodes: TreeNode[]): boolean {
  if (ancestorLevel === 0) return true;

  // Find the ancestor at this level from node's path
  const ancestorPath = node.path.slice(0, ancestorLevel + 1);
  const ancestor = allNodes.find((n) => n.path.join('/') === ancestorPath.join('/'));

  if (!ancestor) return true;

  return isLastChild(ancestor, allNodes);
}

export const Indentation: React.FC<IndentationProps> = ({ node, allNodes }) => {
  if (node.level === 0) {
    return null;
  }

  const ancestorCount = getAncestorCount(node);
  const isLeaf = isLastChild(node, allNodes);

  return (
    <>
      {/* Render vertical lines for ancestors */}
      {Array.from({ length: ancestorCount }).map((_, index) => {
        const ancestorLevel = index + 1;
        const shouldShowVerticalLine = !isAncestorLastChild(node, ancestorLevel, allNodes);

        return (
          <div
            key={`ancestor-${index}`}
            className={cx(styles.indentation, {
              [styles.vertical]: shouldShowVerticalLine,
            })}
          />
        );
      })}

      {/* Render the connector for this node */}
      <div
        className={cx(styles.indentation, {
          [styles.lShaped]: isLeaf,
          [styles.tShaped]: !isLeaf,
        })}
      />
    </>
  );
};
