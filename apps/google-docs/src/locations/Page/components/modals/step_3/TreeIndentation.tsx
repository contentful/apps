import React from 'react';
import { css, cx } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import { TreeNode } from './tree-utils';

interface TreeIndentationProps {
  node: TreeNode;
  isLastChild: boolean;
  allNodes: TreeNode[];
}

const INDENTATION_SIZE = 32;
const OFFSET = 2.75;
const BORDER_RADIUS = '4px';

const styles = {
  indentation: css({
    padding: `0 ${INDENTATION_SIZE / 2}px`,
    height: '100%',
  }),
  vertical: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    transform: `translateX(${INDENTATION_SIZE / OFFSET}px)`,
  }),
  lShaped: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    borderBottom: `1px solid ${tokens.gray300}`,
    borderBottomLeftRadius: BORDER_RADIUS,
    position: 'relative',
    transform: `translateY(-50%) translateX(${INDENTATION_SIZE / OFFSET}px)`,
    height: '50%',
  }),
  tShaped: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    position: 'relative',
    transform: `translateX(${INDENTATION_SIZE / OFFSET}px)`,
    '::after': {
      content: '""',
      backgroundColor: tokens.gray300,
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'block',
      height: '1px',
      width: '100%',
      borderTopRightRadius: BORDER_RADIUS,
      borderBottomRightRadius: BORDER_RADIUS,
    },
  }),
};

/**
 * Gets ancestors for a node to render vertical lines
 */
function getAncestors(node: TreeNode, allNodes: TreeNode[]): TreeNode[] {
  const ancestors: TreeNode[] = [];

  for (let i = 1; i < node.path.length; i++) {
    const ancestorPath = node.path.slice(0, i);
    const ancestor = allNodes.find((n) => n.path.join('/') === ancestorPath.join('/'));
    if (ancestor) {
      ancestors.push(ancestor);
    }
  }

  return ancestors;
}

/**
 * Check if an ancestor is the last child at its level
 */
function isAncestorLastChild(ancestor: TreeNode, allNodes: TreeNode[]): boolean {
  if (ancestor.level === 0) return true;

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

  const ancestors = getAncestors(node, allNodes);

  return (
    <>
      {ancestors.map((ancestor, index) => {
        const shouldShowVerticalLine = !isAncestorLastChild(ancestor, allNodes);

        return (
          <div
            key={index}
            className={cx(styles.indentation, {
              [styles.vertical]: shouldShowVerticalLine,
            })}
          />
        );
      })}

      <div
        className={cx(styles.indentation, {
          [styles.lShaped]: isLastChild,
          [styles.tShaped]: !isLastChild,
        })}
      />
    </>
  );
};
