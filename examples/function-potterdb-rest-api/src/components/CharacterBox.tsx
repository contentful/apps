import React from 'react';
import type { ReactElement } from 'react';
import {
  Flex,
  Button,
  SkeletonImage,
  Skeleton,
  Box,
  Caption,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { CharacterAttributes } from '../types';

const styles = {
  image: css`
    width: 120px;
    max-height: 90px;
    padding-right: ${tokens.spacingM};
  `,
  title: css`
    flex: 1;
    text-align: left;
  `,
};

type Props = {
  character?: CharacterAttributes;
  onClick?: (character: CharacterAttributes) => void;
  ctaText?: string;
};

export function CharacterBox({ character, onClick, ctaText = 'Select' }: Props): ReactElement {
  if (!character) {
    return (
      <Flex alignItems="center">
        <Box>
          <Skeleton.Container svgWidth={100} svgHeight={100}>
            <SkeletonImage />
          </Skeleton.Container>
        </Box>
        <Box>
          <Skeleton.Container svgHeight={100}>
            <Skeleton.BodyText />
          </Skeleton.Container>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Flex>
        <img src={character?.image} alt={character?.name} className={styles.image} />
        <Flex flexDirection="column">
          <Caption fontWeight="fontWeightMedium" className={styles.title}>{character?.name}</Caption>
          <Flex>
            <Caption>Born: {character?.born?.slice(0, 25) ?? '??'}</Caption>
            <Caption>Gender: {character?.gender ?? '??'}</Caption>
          </Flex>
        </Flex>
      </Flex>
      {onClick && (
        <Button style={{ maxHeight: '20px' }} onClick={() => onClick(character)}>
          {ctaText}
        </Button>
      )}
    </Flex>
  );
}
