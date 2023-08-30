import * as React from 'react';
import { Box, Caption, Flex, Grid, Text } from '@contentful/f36-components';
import { ExternalResourceError } from '../types';
import { truncate } from 'lodash';
import { ProductImage } from '../ProductImage';
import { PropsWithChildren } from 'react';

const EXCERPT_LENGTH = 75;
const DESCRIPTION_LENGTH = 220;

type ProductCardProps = PropsWithChildren<{
  title?: string;
  description?: string;
  image?: string;
  id?: string;
  externalResourceError?: ExternalResourceError;
  isExpanded?: boolean;
}>;

export const ProductCardBody = (props: ProductCardProps) => {
  const {
    title: productName,
    description: productDescription,
    image: productImage,
    id: productId,
    externalResourceError,
    children,
  } = props;

  const hasError = !!externalResourceError?.error;

  const renderErrorBody = () => (
    <Text
      fontSize="fontSizeL"
      fontWeight="fontWeightDemiBold"
      lineHeight="lineHeightL"
      isWordBreak={true}>
      Resource is missing or inaccessible
    </Text>
  );

  const renderMainBody = () => (
    <Grid data-test-id="main-product-card-body" rowGap="spacingXs">
      <Grid.Item>
        <Text fontWeight="fontWeightDemiBold" isWordBreak={true}>
          {truncate(productName, { length: EXCERPT_LENGTH })}
        </Text>
      </Grid.Item>
      <Grid.Item>
        {/* Caption does not allow a fontColor prop */}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <Caption fontColor="gray600" fontWeight={'fontWeightMedium'}>
          {productId}
        </Caption>
      </Grid.Item>
      <Grid.Item>
        <Text isWordBreak={true}>
          {truncate(productDescription, {
            length: props.isExpanded ? DESCRIPTION_LENGTH : EXCERPT_LENGTH,
            separator: ' ',
          })}
        </Text>
      </Grid.Item>
    </Grid>
  );

  return (
    <Box padding="spacingM" paddingBottom="spacing2Xs">
      <Flex fullWidth={true} justifyContent="space-between">
        {hasError ? renderErrorBody() : renderMainBody()}
        {!hasError && (
          <ProductImage src={productImage} alt={productName} width="70px" height="70px" />
        )}
      </Flex>
      {children}
    </Box>
  );
};
