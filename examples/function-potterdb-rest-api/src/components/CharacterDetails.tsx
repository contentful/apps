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
  Caption,
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
      <Flex>
        <img src={character?.image} alt={character?.name} className={styles.image} />
        <Flex marginLeft={'spacingM'} flexDirection="column">
          <Flex alignItems="center">
            <Subheading className={styles.title}>{character.name}</Subheading>
          </Flex>
          <Flex justifyContent="space-between">
            <Flex flexDirection="column">
              <Flex>
                <Caption fontWeight="fontWeightMedium" marginRight='spacingS'>Born:</Caption>{' '}
                <Caption>{character?.born?.slice(0, 25) ?? '??'}</Caption>
              </Flex>
              <Flex>
                <Caption fontWeight="fontWeightMedium" marginRight='spacingS'>Nationality:</Caption>{' '}
                <Caption>{character?.nationality?? '??'}</Caption>
              </Flex>
              <Flex>
                <Caption fontWeight="fontWeightMedium" marginRight='spacingS'>Gender:</Caption>{' '}
                <Caption>{character.gender ?? '??'}</Caption>
              </Flex>
            </Flex>
            <Flex flexDirection="column" marginLeft={'spacingM'}>
              <Flex>
                <Caption fontWeight="fontWeightMedium" marginRight='spacingS'>House:</Caption>{' '}
                <Caption>{character?.house ?? '??'}</Caption>
              </Flex>
              <Flex>
                <Caption fontWeight="fontWeightMedium" marginRight='spacingS'> Species:</Caption>{' '}
                <Caption>{character.species ?? '??'}</Caption>
              </Flex>
              <Flex>
                <Caption fontWeight="fontWeightMedium" marginRight='spacingS'> Titles:</Caption>{' '}
                <Caption>{character.titles?.join(', ') ?? '??'}</Caption>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      {onClick && (
        <Button
          style={{ marginTop: '20px', marginBottom: '20px', width: '90px' }}
          size="small"
          onClick={() => onClick(character)}>
          {ctaText}
        </Button>
      )}
    </Flex>
  );
}
