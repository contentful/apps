import type { ReactElement } from 'react';
import { Flex, Button, Subheading, SkeletonImage, Skeleton, Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

import type { Product as ProductProps } from '../typings';

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
  product?: ProductProps;
  onClick?: (product: ProductProps) => void;
  ctaText?: string;
};

export function Product({ product, onClick, ctaText = 'Select' }: Props): ReactElement {
  if (!product) {
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
      <img src={product.featuredImage.url} alt={product.title} className={styles.image} />
      <Subheading className={styles.title}>{product.title}</Subheading>
      {onClick && <Button onClick={() => onClick(product)}>{ctaText}</Button>}
    </Flex>
  );
}
