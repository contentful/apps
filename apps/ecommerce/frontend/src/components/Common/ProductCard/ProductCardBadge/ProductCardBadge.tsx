import { Badge, Box, EntityStatus } from '@contentful/f36-components';
import { ExternalResourceError } from 'types';
import { styles } from './ProductCardBadge.styles';

interface ProductCardBadgeProps {
  showHeaderMenu?: boolean;
  externalResourceError?: ExternalResourceError;
  status?: EntityStatus;
}

const ProductCardBadge = (props: ProductCardBadgeProps) => {
  const { showHeaderMenu, externalResourceError, status } = props;
  const { error, errorMessage, errorStatus } = externalResourceError || {};

  if (error) {
    return <Badge variant={errorStatus === 404 ? 'warning' : 'negative'}>{errorMessage}</Badge>;
  }
  if (showHeaderMenu) {
    return <Badge variant="featured">{status}</Badge>;
  }

  return (
    <Box data-test-id="badge-style-wrapper" className={styles.badge}>
      <Badge variant="featured">{status}</Badge>
    </Box>
  );
};

export default ProductCardBadge;
