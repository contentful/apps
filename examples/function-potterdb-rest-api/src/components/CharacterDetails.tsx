import React from 'react';
import type { ReactElement } from 'react';
import {
  Flex,
  Button,
  Subheading,
  SkeletonImage,
  Skeleton,
  Box,
  Paragraph,
  Text,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { CharacterAttributes } from '../types';

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
  character?: CharacterAttributes;
  onClick?: (character: CharacterAttributes) => void;
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
    <Flex flexDirection="column">
      {/* <img src={product.featuredImage.url} alt={product.title} className={styles.image} /> */}
      <Flex alignItems="center">
        <Subheading className={styles.title}>{character.name}</Subheading>
      </Flex>
      <Flex justifyContent='space-around'>
        <Flex flexDirection="column">
          <Paragraph>
            <Text as='u'>Born:</Text> {character.born}</Paragraph>
          <Paragraph>Gender: {character.gender ?? '??'}</Paragraph>
        </Flex>
        <Flex flexDirection="column">
        <Paragraph>Nationality: {character.nationality ?? '??'}</Paragraph>
          <Paragraph>Species: {character.species ?? '??'}</Paragraph>
        </Flex>
        <Flex flexDirection="column">
          <Paragraph>House: {character.house ?? '??'}</Paragraph>
          <Paragraph>Jobs: {character.jobs?.join(', ')}</Paragraph>
        </Flex>
      </Flex>
        {onClick && <Button onClick={() => onClick(character)}>{ctaText}</Button>}
    </Flex>
  );
}
