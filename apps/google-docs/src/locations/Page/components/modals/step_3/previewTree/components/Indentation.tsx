import React from 'react';
import { cx } from '@emotion/css';
import { styles } from './PreviewTreeView.styles';
import { FlatTreeNode } from '../types';

interface IndentationProps {
  node: FlatTreeNode;
  isLastChild: boolean;
}

/**
 * Renders the tree indentation lines
 */
export const Indentation: React.FC<IndentationProps> = ({ node, isLastChild }) => {
  if (node.level === 0) {
    return null;
  }

  const { level, ancestorHasSiblings = [] } = node;
  const indentations = [];

  // Render indentation for each level
  for (let i = 0; i < level; i++) {
    const isLastLevel = i === level - 1;

    if (isLastLevel) {
      // Last level: L-shaped for last child, T-shaped for others
      indentations.push(
        <div
          key={i}
          className={cx(styles.indentation, {
            [styles.lShaped]: isLastChild,
            [styles.tShaped]: !isLastChild,
          })}
        />
      );
    } else {
      // Ancestor levels: show vertical line only if ancestor has more siblings
      const showVertical = ancestorHasSiblings[i];
      indentations.push(
        <div
          key={i}
          className={cx(styles.indentation, {
            [styles.vertical]: showVertical,
          })}
        />
      );
    }
  }

  return <>{indentations}</>;
};
