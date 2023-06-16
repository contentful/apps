import { Box, Flex, Grid, Text } from '@contentful/f36-components';
import { ExternalResourceError } from 'types';

interface ProductCardProps {
  title?: string;
  description?: string;
  // TO DO fix image mapping
  image?: any;
  id?: string;
  externalResourceError?: ExternalResourceError;
}

const ProductCardBody = (props: ProductCardProps) => {
  const {
    title: productName,
    description: productDescription,
    image: productImage,
    id: productId,
    externalResourceError,
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
        {externalResourceError?.error ? renderErrorBody() : renderMainBody()}

        {productImage && <img src={productImage} alt={productName} width="70" height="70" />}
      </Flex>
    </Box>
  );
};

export default ProductCardBody;
