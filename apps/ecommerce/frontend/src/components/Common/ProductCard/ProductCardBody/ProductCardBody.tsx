import { Box, Flex, Grid, Text } from '@contentful/f36-components';
import { ExternalResourceError } from 'types';

interface ProductCardProps {
  title?: string;
  description?: string;
  image?: string;
  id?: string;
  error?: ExternalResourceError;
}

const ProductCardBody = (props: ProductCardProps) => {
  const {
    title: productName,
    description: productDescription,
    image: productImage,
    id: productId,
    error,
  } = props;

  const renderErrorBody = () => (
    <Text
      fontSize="fontSizeL"
      fontWeight="fontWeightDemiBold"
      lineHeight="lineHeightL"
      isWordBreak={true}>
      Resource is missing or inaccessible
    </Text>
  );

  const renderMainBody = () => (
    <Grid data-test-id="main-product-card-body" rowGap="spacingXs">
      <Grid.Item>
        <Text
          fontSize="fontSizeL"
          fontWeight="fontWeightDemiBold"
          lineHeight="lineHeightL"
          isWordBreak={true}>
          {productName}
        </Text>
      </Grid.Item>
      <Grid.Item>
        <Text>{productDescription}</Text>
      </Grid.Item>
      <Grid.Item>
        <Text fontColor="gray600">{productId}</Text>
      </Grid.Item>
    </Grid>
  );

  // TODO: Handle missing image
  return (
    <Box padding="spacingM">
      <Flex fullWidth={true} justifyContent="space-between">
        {error ? renderErrorBody() : renderMainBody()}

        {productImage && <img src={productImage} alt={productName} width="70" height="70" />}
      </Flex>
    </Box>
  );
};

export default ProductCardBody;
