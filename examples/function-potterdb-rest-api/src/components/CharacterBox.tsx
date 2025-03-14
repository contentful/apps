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
  containerMargin: css`
    margin-bottom: ${tokens.spacing2Xs};
  `,
  image: css`
    border-radius: 10%;
    width: 90px;
    max-height: 100px;
    margin-right: ${tokens.spacingM};
  `,
  description: css`
    gap: ${tokens.spacingM};
  `,

  captionField: css`
    margin-right: ${tokens.spacingXs};
  `,
};

type CharacterBoxProps = {
  character?: CharacterAttributes;
  onClick: (character: CharacterAttributes) => void;
};

export function CharacterBox({ character, onClick }: CharacterBoxProps): ReactElement {
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
        <Flex flexDirection="column" marginTop="spacing2Xs">
          <Subheading>{character?.name}</Subheading>
          <Flex className={styles.description}>
            <Flex flexDirection="column">
              <Flex className={styles.containerMargin}>
                <Caption className={styles.captionField}>Nationality:</Caption>{' '}
                <Caption>{character?.nationality ?? '??'}</Caption>
              </Flex>
              <Flex className={styles.containerMargin}>
                <Caption className={styles.captionField}>House:</Caption>{' '}
                <Caption>{character?.house ?? '??'}</Caption>
              </Flex>
              <Flex className={styles.containerMargin}>
                <Caption className={styles.captionField}>Gender:</Caption>{' '}
                <Caption>{character.gender ?? '??'}</Caption>
              </Flex>
            </Flex>
            <Flex flexDirection="column" marginLeft="spacingM">
              <Flex className={styles.containerMargin}>
                <Caption className={styles.captionField}> Species:</Caption>{' '}
                <Caption>{character.species ?? '??'}</Caption>
              </Flex>
              <Flex className={styles.containerMargin}>
                <Caption className={styles.captionField}>Born:</Caption>{' '}
                <Caption>{character?.born?.slice(0, 25) ?? '??'}</Caption>
              </Flex>
              <Flex className={styles.containerMargin}>
                <Caption className={styles.captionField}> Titles:</Caption>{' '}
                <Caption>{character.titles?.join(', ') ?? '??'}</Caption>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </EntryCard>
  );
}
