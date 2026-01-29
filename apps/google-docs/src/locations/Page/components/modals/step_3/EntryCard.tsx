import React from 'react';
import { Box, Flex, Text } from '@contentful/f36-components';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import { TreeNode } from './tree-utils';

interface EntryCardProps {
  node: TreeNode;
}

const MAX_TITLE_LENGTH = 60;

const styles = {
  card: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingXs,
    backgroundColor: tokens.colorWhite,
    transition: 'box-shadow 0.2s ease',
    flex: 1,
    alignSelf: 'center',
    zIndex: 1,
  }),
  parentCard: css({
    borderWidth: '2px',
    borderColor: tokens.gray400,
  }),
  title: css({
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
};

export const EntryCard: React.FC<EntryCardProps> = ({ node }) => {
  const isParent = node.hasChildren;
  const truncatedTitle =
    node.title.length > MAX_TITLE_LENGTH
      ? node.title.substring(0, MAX_TITLE_LENGTH) + '...'
      : node.title;

  return (
    <Box className={css(styles.card, isParent && styles.parentCard)}>
      <Flex alignItems="center" gap="spacingXs" flexWrap="wrap">
        <Text
          fontWeight={isParent ? 'fontWeightMedium' : 'fontWeightNormal'}
          fontSize="fontSizeM"
          fontColor="gray900"
          className={styles.title}>
          {truncatedTitle}
        </Text>
        <Text fontColor="gray500" fontSize="fontSizeM" as="span">
          ({node.contentTypeName})
        </Text>
      </Flex>
    </Box>
  );
};
