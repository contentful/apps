import { Box, Flex, Grid, Text } from '@contentful/f36-components';

interface Props {
  name: string;
  description: string;
  image: string;
  id: string;
}

const ResourceCardBody = (props: Props) => {
  const {
    name: productName,
    description: productDescription,
    image: productImage,
    id: productId,
  } = props;

  return (
    <Box padding="spacingM">
      <Flex fullWidth={true} justifyContent="space-between">
        <Grid rowGap="spacingXs">
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
        {productImage && <img src={productImage} alt={productName} width="70" height="70" />}
      </Flex>
    </Box>
  );
};

export default ResourceCardBody;
