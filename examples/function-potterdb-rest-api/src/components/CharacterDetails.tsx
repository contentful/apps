import React from 'react';
import type { ReactElement } from 'react';
import {
  Flex,
  SkeletonImage,
  Skeleton,
  Box,
  Caption,
  EntryCard,
  IconButton,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { CharacterAttributes } from '../types';
import { CloseIcon } from '@contentful/f36-icons';

const styles = {
  image: css`
    border-radius: 10%;
  `,
  description: css`
    font-color: ${tokens.gray100};
  `,
};

type Props = {
  character?: CharacterAttributes;
  onClick: (character: CharacterAttributes) => void;
  ctaText?: string;
};

export function CharacterDetails({ character, onClick, ctaText = 'Select' }: Props): ReactElement {
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
    <EntryCard
      contentType="Avatar"
      title={character?.name}
      thumbnailElement={
        <img src={character?.image} alt={character?.name} className={styles.image} />
      }
      customActionButton={
        <IconButton
          aria-label="Actions"
          icon={<CloseIcon variant="muted" />}
          size="small"
          variant="transparent"
          onClick={() => onClick(character)}
        />
      }>
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
    </EntryCard>
  );
}
