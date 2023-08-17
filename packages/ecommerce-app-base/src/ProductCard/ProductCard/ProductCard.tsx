import * as React from 'react';
import { useState } from 'react';
import { Box, Card, TextLink } from '@contentful/f36-components';
import { styles } from './ProductCard.styles';
import { ExternalResource, ExternalResourceError, ProductCardType, RenderDragFn } from '../types';
import ProductCardHeader from '../ProductCardHeader/ProductCardHeader';
import ProductCardBody from '../ProductCardBody/ProductCardBody';
import { ProductCardAdditionalData } from '../ProductCardAdditionalData';

export interface ProductCardProps {
  resource: ExternalResource;
  title: string;
  productCardType?: ProductCardType;
  handleRemove?: (index?: number) => void;
  onSelect?: (resource: ExternalResource) => void;
  isSelected?: boolean;
  dragHandleRender?: RenderDragFn;
  isLoading?: boolean;
  cardIndex?: number;
  externalResourceError?: ExternalResourceError;
}

const ProductCard = (props: ProductCardProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const {
    cardIndex = 0,
    productCardType = 'dialog',
    isLoading,
    resource,
    title,
    handleRemove,
    onSelect,
    isSelected,
    dragHandleRender,
    externalResourceError,
  } = props;

  const fieldProductCardType = productCardType === 'field';
  const hasError = externalResourceError?.error;
  const displaySKU =
    resource.displaySKU ?? resource.sku
      ? `Product SKU: ${resource.sku}`
      : `Product ID: ${resource.id}`;

  return (
    <Card
      padding="none"
      className={styles.productCard}
      isSelected={isSelected}
      onClick={() => {
        !!onSelect && onSelect(resource);
      }}
      isLoading={isLoading}
      withDragHandle={!!dragHandleRender}
      dragHandleRender={dragHandleRender}>
      <ProductCardHeader
        headerTitle={title}
        resource={resource}
        handleRemove={handleRemove}
        cardIndex={cardIndex}
        isExpanded={isExpanded}
        showHeaderMenu={Boolean(fieldProductCardType)}
      />

      <ProductCardBody
        title={resource.name}
        description={resource.description ?? '{no description provided}'}
        image={resource?.image ?? ''}
        id={displaySKU}
        isExpanded={isExpanded}
        externalResourceError={externalResourceError}
      />

      {!hasError && (
        <Box marginBottom="spacingM" marginLeft="spacingM">
          <ProductCardAdditionalData isExpanded={isExpanded}>
            {resource.description}
          </ProductCardAdditionalData>
          <TextLink as="button" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'hide details' : 'more details'}
          </TextLink>
        </Box>
      )}
    </Card>
  );
};

export default ProductCard;
