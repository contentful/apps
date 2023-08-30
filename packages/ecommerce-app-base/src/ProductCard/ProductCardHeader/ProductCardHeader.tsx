import { Box, Flex, Text } from '@contentful/f36-components';
import { ProductCardMenu } from '../ProductCardMenu/ProductCardMenu';
import { ExternalResource } from '../types';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  productCardHeader: css({
    padding: `${tokens.spacingXs} ${tokens.spacingS}`,
    paddingLeft: tokens.spacingM,
    borderBottom: `1px solid ${tokens.gray200}`,
  }),
};
type Props = {
  headerTitle: string;
  resource?: ExternalResource;
  handleRemove?: () => void;
  isExpanded?: boolean;
  showHeaderMenu?: boolean;
};

export const ProductCardHeader = (props: Props) => {
  const { headerTitle, handleRemove, showHeaderMenu } = props;

  return (
    <Box className={styles.productCardHeader}>
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
