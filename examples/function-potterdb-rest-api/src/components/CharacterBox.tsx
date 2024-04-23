import React from 'react';
import type { ReactElement } from 'react';
import { Flex, Button, Subheading, SkeletonImage, Skeleton, Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { Character } from '../hooks/useCharacters';

const styles = {
  image: css`
    width: 100px;
    padding-right: ${tokens.spacingM};
  `,
  title: css`
    flex: 1;
    text-align: left;
  `,
};

type Props = {
  character?: Character;
  onClick?: (character: Character) => void;
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
    <Flex alignItems="center">
      {/* <img src={product.featuredImage.url} alt={product.title} className={styles.image} /> */}
      <Subheading className={styles.title}>{character.name}</Subheading>
      {onClick && <Button onClick={() => onClick(character)}>{ctaText}</Button>}
    </Flex>
  );
}
