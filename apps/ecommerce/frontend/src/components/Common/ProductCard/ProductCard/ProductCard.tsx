import { useState } from 'react';
import { Card } from '@contentful/f36-components';
import { styles } from './ProductCard.styles';
import { ExternalResource, ExternalResourceError, ExternalResourceLink, ProductCardType } from 'types';
import ProductCardHeader from '../ProductCardHeader/ProductCardHeader';
import ProductCardBody from '../ProductCardBody/ProductCardBody';
import { RenderDragFn } from '@contentful/field-editor-reference/dist/types';
import ProductCardRawData from '../ProductCardRawData/ProductCardRawData';

type CardMovementCallbacks = {
  handleMoveToTop?: (index?: number) => void;
  handleMoveToBottom?: (index?: number) => void;
};

export interface ProductCardProps {
  // TODO: Fix the CardHeader type during the mapping config refactor/ticket
  resource: any;
  cardHeader: string;
  productCardType?: ProductCardType;
  handleRemove?: (index?: number) => void;
  onSelect?: (resource: ExternalResource) => void;
  isSelected?: boolean;
  dragHandleRender?: RenderDragFn;
  isLoading?: boolean;
  cardIndex?: number;
  totalCards?: number;
  externalResourceLink?: ExternalResourceLink;
  cardMovementCallbacks?: CardMovementCallbacks;
  isHovered?: boolean;
  externalResourceError?: ExternalResourceError;
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
    isHovered,
    externalResourceError,
  } = props;

  const { handleMoveToBottom, handleMoveToTop } = cardMovementCallbacks || {};
  const fieldProductCardType = productCardType === 'field';
  const renderRawData = !externalResourceError?.error && fieldProductCardType && externalResourceLink && showJson;

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
      isHovered={isHovered}>
      <ProductCardHeader
        headerTitle={cardHeader}
        resource={resource}
        handleRemove={handleRemove}
        cardIndex={cardIndex}
        totalCards={totalCards}
        showJson={showJson}
        handleShowJson={setShowJson}
        // TO DO: provide link string when logic is built
        externalDetailsLink={''}
        handleMoveToBottom={handleMoveToBottom}
        handleMoveToTop={handleMoveToTop}
        showHeaderMenu={Boolean(fieldProductCardType)}
        error={externalResourceError}
      />

      <ProductCardBody
        title={resource.title}
        description={resource.description}
        image={resource?.image || resource?.images?.[0]?.src || ''}
        id={resource.id}
        externalResourceError={externalResourceError}
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
