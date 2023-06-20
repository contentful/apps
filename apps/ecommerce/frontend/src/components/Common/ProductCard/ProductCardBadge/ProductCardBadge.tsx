import { Badge, Box } from '@contentful/f36-components';
import { ExternalResource, ExternalResourceError } from 'types';
import { styles } from './ProductCardBadge.styles';

interface ProductCardBadgeProps {
  showHeaderMenu?: boolean;
  externalResourceError?: ExternalResourceError;
  resource?: ExternalResource;
}

const WithStyleWrapper = (children: JSX.Element) => (
  <Box data-test-id="badge-style-wrapper" className={styles.badge}>
    {children}
  </Box>
)

const ProductCardBadge = (props: ProductCardBadgeProps) => {
  const { showHeaderMenu, externalResourceError, resource } = props;
  const { error, errorMessage, errorStatus } = externalResourceError || {};

  // TO DO: Ensure the status/badge state is consistent based on data provided
  const getDisplayStatus = () => {
    if (resource?.status) return resource?.status;
    return resource?.availableForSale ? 'Available' : 'Not Available'
  }

  if (error) {
    return WithStyleWrapper(<Badge variant={errorStatus === 404 ? 'warning' : 'negative'}>{errorMessage}</Badge>)
  }
  if (showHeaderMenu) {
    return <Badge variant="featured">{getDisplayStatus()}</Badge>;
  }

  return WithStyleWrapper(<Badge variant="featured">{getDisplayStatus()}</Badge>);
};

export default ProductCardBadge;
