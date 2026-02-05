import React from 'react';
import { Box, Flex, Text, Tooltip } from '@contentful/f36-components';
import { RepeatIcon } from '@contentful/f36-icons';
import { css } from '@emotion/css';
import { entryCardStyles as styles } from './EntryCard.styles';
import { TreeNode } from '../utils/tree-utils';

interface EntryCardProps {
  node: TreeNode;
}

const MAX_TITLE_LENGTH = 60;

export const EntryCard: React.FC<EntryCardProps> = ({ node }) => {
  const isRoot = node.level === 0;
  const isCircular = node.isCircular;
  const truncatedTitle =
    node.title.length > MAX_TITLE_LENGTH
      ? node.title.substring(0, MAX_TITLE_LENGTH) + '...'
      : node.title;

  return (
    <Box className={css(styles.card, isRoot && !isCircular && styles.rootCard)}>
      <Flex alignItems="center" gap="spacingXs" flexWrap="wrap">
        {isCircular && (
          <Tooltip
            placement="top"
            content="This entry has already been referenced in one of the parent entries.">
            <RepeatIcon variant="secondary" className={styles.circularIcon} />
          </Tooltip>
        )}
        <Text
          fontWeight={isRoot && !isCircular ? 'fontWeightMedium' : 'fontWeightNormal'}
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
