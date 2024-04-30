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
  Subheading,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { CharacterAttributes } from '../types';
import { CloseIcon } from '@contentful/f36-icons';

const styles = {
  image: css`
    border-radius: 10%;
    height: 110px;
    width: 110px;
    margin-right: ${tokens.spacingM};
  `,
  description: css`
    font-color: ${tokens.gray900};
  `,
};

type Props = {
  character?: CharacterAttributes;
  onClick: (character: CharacterAttributes) => void;
};

export function CharacterDetails({ character, onClick }: Props): ReactElement {
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
      customActionButton={
        <IconButton
          aria-label="Actions"
          icon={<CloseIcon variant="muted" />}
          size="small"
          variant="transparent"
          onClick={() => onClick(character)}
        />
      }>
      <Flex alignItems="center">
        <img src={character?.image} alt={character?.name} className={styles.image} />
        <Flex flexDirection="column">
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
