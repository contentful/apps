import { useState } from 'react';
import { Card } from '@contentful/f36-components';
import { styles } from './ProductCard.styles';
import { ExternalResource, ExternalResourceLink, ProductCardType } from 'types';
import ProductCardHeader from '../ProductCardHeader/ProductCardHeader';
import ProductCardBody from '../ProductCardBody/ProductCardBody';
import { RenderDragFn } from '@contentful/field-editor-reference/dist/types';
import ProductCardRawData from '../ProductCardRawData/ProductCardRawData';

type CardMovementCallbacks = {
  handleMoveToTop?: (index?: number) => void;
  handleMoveToBottom?: (index?: number) => void;
};

export interface ProductCardProps {
  resource: ExternalResource;
  cardHeader: string;
  productCardType?: ProductCardType;
  handleRemove?: (index?: number) => void;
  onSelect?: (resource: ExternalResource) => void;
  isSelected?: boolean;
  dragHandleRender?: RenderDragFn;
  isLoading?: boolean;
  cardIndex?: number;
  totalCards?: number;
  externalResourceLink?: any;
  cardMovementCallbacks?: CardMovementCallbacks;
  // TO DO: add error state
  // error state>>>>>
}

const ProductCard = (props: ProductCardProps) => {
  const [showJson, setShowJson] = useState<boolean>(false);

  const {
    cardIndex,
    totalCards,
    productCardType = 'dialog',
    isLoading,
    resource,
    cardHeader,
    handleRemove,
    onSelect,
    isSelected,
    dragHandleRender,
    externalResourceLink,
    cardMovementCallbacks,
  } = props;

  const { handleMoveToBottom, handleMoveToTop } = cardMovementCallbacks || {};
  const fieldProductCardType = productCardType === 'field';

  return (
    <Card
      padding="none"
      className={styles.productCard}
      isSelected={isSelected}
      onClick={() => {
        onSelect && onSelect(resource);
      }}
      isLoading={isLoading}
      withDragHandle={!!dragHandleRender}
      dragHandleRender={dragHandleRender}>
      <ProductCardHeader
        headerTitle={cardHeader}
        status={resource.status ?? ''}
        handleRemove={handleRemove}
        cardIndex={cardIndex}
        totalCards={totalCards}
        showJson={showJson}
        handleShowJson={setShowJson}
        showExternalResourceLinkDetails={Boolean(externalResourceLink)}
        handleMoveToBottom={handleMoveToBottom}
        handleMoveToTop={handleMoveToTop}
        showHeaderMenu={Boolean(fieldProductCardType)}
      />

      <ProductCardBody
        name={resource.name ?? ''}
        description={resource.description ?? ''}
        image={resource.image ?? ''}
        id={resource.id ?? ''}
      />

      {fieldProductCardType && externalResourceLink && showJson && (
        <ProductCardRawData
          value={JSON.stringify(externalResourceLink)}
          isVisible={showJson}
          onHide={() => setShowJson(false)}
        />
      )}
    </Card>
  );
};

export default ProductCard;
