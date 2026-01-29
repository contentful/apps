import React from 'react';
import { css, cx } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import { TreeNode } from './tree-utils';

interface TreeIndentationProps {
  node: TreeNode;
  isLastChild: boolean;
  allNodes: TreeNode[];
}

const INDENTATION_SIZE = 24.5;
const OFFSET = 2.75;
const BORDER_RADIUS = '4px';

const styles = {
  indentation: css({
    width: `${INDENTATION_SIZE}px`,
    flexShrink: 0,
  }),
  vertical: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    marginLeft: `${INDENTATION_SIZE / OFFSET}px`,
  }),
  lShaped: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    borderBottom: `1px solid ${tokens.gray300}`,
    borderBottomLeftRadius: BORDER_RADIUS,
    position: 'relative',
    marginLeft: `${INDENTATION_SIZE / OFFSET}px`,
  }),
  tShaped: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    position: 'relative',
    marginLeft: `${INDENTATION_SIZE / OFFSET}px`,
    '&::after': {
      content: '""',
      backgroundColor: tokens.gray300,
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'block',
      height: '1px',
      width: `${INDENTATION_SIZE}px`,
      borderTopRightRadius: BORDER_RADIUS,
      borderBottomRightRadius: BORDER_RADIUS,
    },
  }),
};

/**
 * Simple approach: build ancestor path representation
 */
function getAncestorCount(node: TreeNode): number {
  // Level 0 = root, no indentation
  // Level 1 = 0 ancestors (direct children of root)
  // Level 2 = 1 ancestor, etc.
  return Math.max(0, node.level - 1);
}

/**
 * Check if an ancestor at a given level is the last child
 */
function isAncestorLastChild(node: TreeNode, ancestorLevel: number, allNodes: TreeNode[]): boolean {
  if (ancestorLevel === 0) return true;

  // Find the ancestor at this level from node's path
  const ancestorPath = node.path.slice(0, ancestorLevel + 1);
  const ancestor = allNodes.find((n) => n.path.join('/') === ancestorPath.join('/'));

  if (!ancestor) return true;

  // Find its parent and siblings
  const parentPath = ancestor.path.slice(0, -1);
  const siblings = allNodes.filter(
    (n) => n.level === ancestor.level && n.path.slice(0, -1).join('/') === parentPath.join('/')
  );

  return siblings[siblings.length - 1]?.id === ancestor.id;
}

export const TreeIndentation: React.FC<TreeIndentationProps> = ({
  node,
  isLastChild,
  allNodes,
}) => {
  if (node.level === 0) {
    return null;
  }

  const ancestorCount = getAncestorCount(node);

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
          [styles.lShaped]: isLastChild,
          [styles.tShaped]: !isLastChild,
        })}
      />
    </>
  );
};
