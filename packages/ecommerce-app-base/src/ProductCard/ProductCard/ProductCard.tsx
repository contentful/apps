import * as React from 'react';
import { useState } from 'react';
import { Box, Card, TextLink } from '@contentful/f36-components';
import { styles } from './ProductCard.styles';
import { ExternalResource, ExternalResourceError, ProductCardType, RenderDragFn } from '../types';
import ProductCardHeader from '../ProductCardHeader/ProductCardHeader';
import ProductCardBody from '../ProductCardBody/ProductCardBody';
import { ProductCardAdditionalData } from '../ProductCardAdditionalData';
import { useIntegration } from '../../Editor';
import { RawData } from '../../AdditionalData';

export interface ProductCardProps {
  resource: ExternalResource;
  title: string;
  productCardType?: ProductCardType;
  handleRemove?: (index?: number) => void;
  onSelect?: (resource: ExternalResource) => void;
  isSelected?: boolean;
  dragHandleRender?: RenderDragFn;
  isLoading?: boolean;
  externalResourceError?: ExternalResourceError;
}

export const ProductCard = (props: ProductCardProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const {
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

  const { additionalDataRenderer } = useIntegration();

  const fieldProductCardType = productCardType === 'field';
  const hasError = externalResourceError?.error;
  const displaySKU =
    resource.displaySKU ??
    (!!resource.sku ? `Product SKU: ${resource.sku}` : `Product ID: ${resource.id}`);

  const renderAdditionalData = () => {
    return (
      <Box marginBottom="spacingS">
        <ProductCardAdditionalData isExpanded={isExpanded}>
          {!!additionalDataRenderer && typeof additionalDataRenderer === 'function' ? (
            additionalDataRenderer({ product: resource })
          ) : (
            <RawData value={resource} />
          )}
        </ProductCardAdditionalData>
        <TextLink
          as="button"
          onClick={() => setIsExpanded((currentIsExpanded) => !currentIsExpanded)}>
          {isExpanded ? 'hide details' : 'more details'}
        </TextLink>
      </Box>
    );
  };

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
        isExpanded={isExpanded}
        showHeaderMenu={Boolean(fieldProductCardType)}
      />

      <ProductCardBody
        title={resource.name}
        description={resource.description ?? '{no description provided}'}
        image={resource?.image ?? ''}
        id={displaySKU}
        isExpanded={isExpanded}
        externalResourceError={externalResourceError}>
        {!hasError && renderAdditionalData()}
      </ProductCardBody>
    </Card>
  );
};
