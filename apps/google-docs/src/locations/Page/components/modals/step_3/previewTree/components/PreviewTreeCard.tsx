import React from 'react';
import { Text } from '@contentful/f36-components';
import { FlatTreeNode } from '../types';
import { styles } from './PreviewTreeView.styles';
import { Indentation } from './Indentation';

interface PreviewTreeCardProps {
  node: FlatTreeNode;
  isLastChild: boolean;
}

const MAX_TITLE_LENGTH = 50;

/**
 * Preview tree card component to display an entry in the tree
 */
export const PreviewTreeCard: React.FC<PreviewTreeCardProps> = ({ node, isLastChild }) => {
  const truncatedTitle =
    node.title.length > MAX_TITLE_LENGTH
      ? node.title.substring(0, MAX_TITLE_LENGTH) + '...'
      : node.title;

  return (
    <div className={styles.wrapper}>
      <Indentation node={node} isLastChild={isLastChild} />
      <div className={styles.card}>
        <Text fontWeight="fontWeightMedium" fontSize="fontSizeM" fontColor="gray900">
          {truncatedTitle}
        </Text>
        <Text fontColor="gray500" fontSize="fontSizeM" as="span">
          ({node.contentTypeName})
        </Text>
      </div>
    </div>
  );
};
