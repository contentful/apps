import * as React from 'react';
import { Box, Flex, Text, IconButton } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { styles } from './ProductCardHeader.styles';
import ProductCardMenu from '../ProductCardMenu/ProductCardMenu';
import { ExternalResource, ExternalResourceError } from '../types';
import ProductCardBadge from '../ProductCardBadge/ProductCardBadge';

interface Props {
  headerTitle: string;
  resource?: ExternalResource;
  handleRemove?: (index?: number) => void;
  showJson?: boolean;
  handleShowJson?: (show: boolean) => void;
  cardIndex?: number;
  totalCards?: number;
  externalDetailsLink?: string;
  handleMoveToBottom?: (index?: number) => void;
  handleMoveToTop?: (index?: number) => void;
  showHeaderMenu?: boolean;
  error?: ExternalResourceError;
}

const ProductCardHeader = (props: Props) => {
  const {
    externalDetailsLink,
    headerTitle,
    resource,
    handleRemove,
    showJson,
    handleShowJson,
    cardIndex,
    totalCards,
    handleMoveToBottom,
    handleMoveToTop,
    showHeaderMenu,
    error,
  } = props;

  return (
    <Box paddingLeft="spacingM" className={styles.productCardHeader}>
      <Flex alignItems="center" fullWidth={true} justifyContent="space-between">
        <Text fontColor="gray600" isWordBreak={true}>
          {headerTitle}
        </Text>

        <Flex alignItems="center" isInline={true}>
          <ProductCardBadge
            showHeaderMenu={showHeaderMenu}
            externalResourceError={error}
            resource={resource}
          />

          {externalDetailsLink && (
            <IconButton
              variant="transparent"
              aria-label="View external resource details"
              size="small"
              // TO DO: add externalDetailsLink redirect logic for onClick event
              icon={<ExternalLinkIcon />}
            />
          )}

          {showHeaderMenu && (
            <ProductCardMenu
              onRemove={() => handleRemove?.call(null, cardIndex)}
              isDataVisible={Boolean(showJson)}
              onShowData={() => handleShowJson?.call(null, true)}
              onHideData={() => handleShowJson?.call(null, false)}
              cardIndex={cardIndex}
              totalCards={totalCards}
              onMoveToBottom={() => handleMoveToBottom?.call(null, cardIndex)}
              onMoveToTop={() => handleMoveToTop?.call(null, cardIndex)}
            />
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default ProductCardHeader;
