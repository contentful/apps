import * as React from 'react';
import { Box, Flex, Text } from '@contentful/f36-components';
import { styles } from './ProductCardHeader.styles';
import ProductCardMenu from '../ProductCardMenu/ProductCardMenu';
import { ExternalResource } from '../types';

type Props = {
  headerTitle: string;
  resource?: ExternalResource;
  handleRemove?: () => void;
  isExpanded?: boolean;
  showHeaderMenu?: boolean;
};

const ProductCardHeader = (props: Props) => {
  const { headerTitle, handleRemove, showHeaderMenu } = props;

  return (
    <Box paddingLeft="spacingM" className={styles.productCardHeader}>
      <Flex alignItems="center" fullWidth={true} justifyContent="space-between">
        <Text fontColor="gray600" isWordBreak={true}>
          {headerTitle}
        </Text>
        <Flex alignItems="center" isInline={true}>
          {showHeaderMenu && <ProductCardMenu onRemove={() => !!handleRemove && handleRemove()} />}
        </Flex>
      </Flex>
    </Box>
  );
};

export default ProductCardHeader;
