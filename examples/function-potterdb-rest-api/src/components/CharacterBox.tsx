import React from 'react';
import type { ReactElement } from 'react';
import {
  Flex,
  SkeletonImage,
  Skeleton,
  Box,
  Caption,
  Subheading,
  EntryCard,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { CharacterAttributes } from '../types';

const styles = {
  card: css`
    &:hover {
      background-color: ${tokens.blue100};
    }
  `,
  image: css`
    border-radius: 10%;
    width: 85px;
    max-height: 90px;
    margin-right: ${tokens.spacingM};
  `,
  title: css`
    margin-bottom: ${tokens.spacingS};
  `,

  description: css`
    gap: ${tokens.spacingM};
  `,
};

type Props = {
  character?: CharacterAttributes;
  onClick: (character: CharacterAttributes) => void;
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
    <EntryCard className={styles.card} onClick={() => onClick(character)}>
      <Flex>
        <img src={character?.image} alt={character?.name} className={styles.image} />
        <Flex flexDirection="column" marginTop="spacingXs">
          <Subheading>{character?.name}</Subheading>
          <Flex className={styles.description}>
            <Flex flexDirection="column">
              <Flex marginBottom="spacing2Xs">
                <Caption marginRight="spacingXs">Nationality:</Caption>{' '}
                <Caption>{character?.nationality ?? '??'}</Caption>
              </Flex>
              <Flex marginRight="spacingL" marginBottom="spacing2Xs">
                <Caption marginRight="spacingXs">House:</Caption>{' '}
                <Caption>{character?.house ?? '??'}</Caption>
              </Flex>
              <Flex marginBottom="spacing2Xs">
                <Caption marginRight="spacingXs">Gender:</Caption>{' '}
                <Caption>{character.gender ?? '??'}</Caption>
              </Flex>
            </Flex>
            <Flex flexDirection="column" marginLeft={'spacingM'}>
              <Flex marginBottom="spacing2Xs">
                <Caption marginRight="spacingXs"> Species:</Caption>{' '}
                <Caption>{character.species ?? '??'}</Caption>
              </Flex>
              <Flex marginBottom="spacing2Xs">
                <Caption marginRight="spacingXs">Born:</Caption>{' '}
                <Caption>{character?.born?.slice(0, 25) ?? '??'}</Caption>
              </Flex>
              <Flex marginBottom="spacing2Xs">
                <Caption marginRight="spacingXs"> Titles:</Caption>{' '}
                <Caption>{character.titles?.join(', ') ?? '??'}</Caption>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </EntryCard>
  );
}