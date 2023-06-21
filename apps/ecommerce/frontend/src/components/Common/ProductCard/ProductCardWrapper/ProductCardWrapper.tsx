import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';
import { useContext, useEffect, useState } from 'react';
import { useDebounce } from 'usehooks-ts';
import ResourceFieldContext from 'context/ResourceFieldContext';
import useExternalResource from 'hooks/field/useExternalResource';
import type { ExternalResourceError, ExternalResourceLink, ProductCardType } from 'types';
import type { RenderDragFn } from '@contentful/field-editor-reference/dist/types';
import ProductCard from 'components/Common/ProductCard';

export interface ProductCardWrapperProps {
  externalResourceLink: ExternalResourceLink;
  cardIndex: number;
  resourceArray: ExternalResourceLink[];
  productCardType: ProductCardType;
  dragHandleRender?: RenderDragFn;
}

const ProductCardWrapper = (props: ProductCardWrapperProps) => {
  const { externalResourceLink, cardIndex, dragHandleRender, resourceArray, productCardType } =
    props;
  const { isMultiple, handleMoveToBottom, handleMoveToTop, handleRemove } =
    useContext(ResourceFieldContext);

  const [resourceLink, setResourceLink] = useState<ExternalResourceLink>(externalResourceLink);
  const debouncedExternalResourceLinkValue = useDebounce(resourceLink, 300);

  const { resourceProvider, resourceType } = getResourceProviderAndType(
    debouncedExternalResourceLinkValue
  );
  const { externalResource, isLoading, error, errorMessage, errorStatus } = useExternalResource(
    debouncedExternalResourceLinkValue
  );

  useEffect(() => {
    const oldValue = JSON.stringify(resourceLink);
    const newValue = JSON.stringify(externalResourceLink);

    if (oldValue !== newValue) {
      setResourceLink(externalResourceLink);
    }
  }, [resourceLink, externalResourceLink]);

  return (
    <ProductCard
      resource={externalResource}
      cardHeader={`${resourceProvider} ${resourceType}`}
      key={cardIndex}
      isLoading={isLoading}
      externalResourceError={{ error, errorMessage, errorStatus } as ExternalResourceError}
      cardIndex={cardIndex}
      totalCards={resourceArray.length}
      dragHandleRender={isMultiple ? dragHandleRender : undefined}
      productCardType={productCardType}
      handleRemove={handleRemove}
      cardMovementCallbacks={{ handleMoveToBottom, handleMoveToTop }}
      externalResourceLink={resourceLink}
    />
  );
};

export default ProductCardWrapper;
