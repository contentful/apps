import { useState } from 'react';
import { Card } from '@contentful/f36-components';
import { styles } from './ProductCard.styles';
import { ExternalResource, ExternalResourceError, ProductCardType } from 'types';
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
  error?: ExternalResourceError;
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
    error,
  } = props;

  const { handleMoveToBottom, handleMoveToTop } = cardMovementCallbacks || {};
  const fieldProductCardType = productCardType === 'field';
  const renderRawData = !error && fieldProductCardType && externalResourceLink && showJson;

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
      dragHandleRender={dragHandleRender}
      // TODO: Determine hover state prop
      isHovered={false}>
      {/* <ProductCardHeader
        headerTitle={cardHeader}
        status={resource.status}
        handleRemove={handleRemove}
        cardIndex={cardIndex}
        totalCards={totalCards}
        showJson={showJson}
        handleShowJson={setShowJson}
        showExternalResourceLinkDetails={!error && Boolean(externalResourceLink)}
        handleMoveToBottom={handleMoveToBottom}
        handleMoveToTop={handleMoveToTop}
        showHeaderMenu={Boolean(fieldProductCardType)}
        error={error}
      /> */}

      <ProductCardBody
        title={resource.title}
        description={resource.description}
        image={resource.image}
        id={resource.id}
        error={error}
      />

      {renderRawData && (
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
