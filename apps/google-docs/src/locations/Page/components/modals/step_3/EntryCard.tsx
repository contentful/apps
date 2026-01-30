import React from 'react';
import { Box, Flex, Text, Tooltip } from '@contentful/f36-components';
import { RepeatIcon } from '@contentful/f36-icons';
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
  rootCard: css({
    borderWidth: '2px',
    borderColor: tokens.gray400,
  }),

  circularCard: css({
    borderColor: tokens.orange400,
    backgroundColor: tokens.orange100,
  }),
  title: css({
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  circularIcon: css({
    flexShrink: 0,
  }),
};

export const EntryCard: React.FC<EntryCardProps> = ({ node }) => {
  const isRoot = node.level === 0;
  const isCircular = node.isCircular;
  const truncatedTitle =
    node.title.length > MAX_TITLE_LENGTH
      ? node.title.substring(0, MAX_TITLE_LENGTH) + '...'
      : node.title;

  return (
    <Box
      className={css(
        styles.card,
        isRoot && !isCircular && styles.rootCard,
        isCircular && styles.circularCard
      )}>
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
