import React from 'react';
import type { ReactElement } from 'react';
import {
  Flex,
  Button,
  SkeletonImage,
  Skeleton,
  Box,
  Caption,
  Subheading,
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
    margin-bottom: ${tokens.spacingS};
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
          <Subheading className={styles.title}>{character?.name}</Subheading>
          <Flex>
              <Flex>
                <Caption fontWeight="fontWeightMedium" marginRight='spacing2Xs'>Born:</Caption>{' '}
                <Caption>{character?.born?.slice(0, 25) ?? '??'}</Caption>
              </Flex>
              <Flex marginLeft={'spacingS'}>
                <Caption fontWeight="fontWeightMedium" marginRight='spacing2Xs'>Gender:</Caption>{' '}
                <Caption>{character.gender ?? '??'}</Caption>
              </Flex>
            </Flex>
            <Flex  marginTop={'spacingM'}>
              <Flex>
                <Caption fontWeight="fontWeightMedium" marginRight='spacing2Xs'>House:</Caption>{' '}
                <Caption>{character?.house ?? '??'}</Caption>
              </Flex>
              <Flex marginLeft={'spacingS'}>
                <Caption fontWeight="fontWeightMedium" marginRight='spacing2Xs'> Species:</Caption>{' '}
                <Caption>{character.species ?? '??'}</Caption>
              </Flex>
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
