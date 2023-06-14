import { Badge, Box, Flex, Text, IconButton } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { styles } from './ProductCardHeader.styles';
import ProductCardMenu from '../ProductCardMenu/ProductCardMenu';
import { ExternalResourceLink } from 'types';

interface Props {
  headerTitle: string;
  status: string;
  handleRemove?: (index?: number) => void;
  showJson: boolean;
  handleShowJson: (show: boolean) => void;
  cardIndex?: number;
  totalCards?: number;
  showExternalResourceLinkDetails?: boolean;
  handleMoveToBottom?: (index?: number) => void;
  handleMoveToTop?: (index?: number) => void;
  showHeaderMenu?: boolean;
}

const ProductCardHeader = (props: Props) => {
  const {
    showExternalResourceLinkDetails,
    headerTitle,
    status,
    handleRemove,
    showJson,
    handleShowJson,
    cardIndex,
    totalCards,
    handleMoveToBottom,
    handleMoveToTop,
    showHeaderMenu,
  } = props;

  return (
    <Box paddingLeft="spacingM" className={styles.productCardHeader}>
      <Flex alignItems="center" fullWidth={true} justifyContent="space-between">
        <Text fontColor="gray600" isWordBreak={true}>
          {headerTitle}
        </Text>
        <Flex alignItems="center" isInline={true}>
          {status &&
            (showHeaderMenu ? (
              <Badge variant="featured">{status}</Badge>
            ) : (
              <Box className={styles.badge}>
                <Badge variant="featured">{status}</Badge>
              </Box>
            ))}
          {showExternalResourceLinkDetails && (
            <IconButton
              variant="transparent"
              aria-label="View external resource details"
              size="small"
              icon={<ExternalLinkIcon />}
            />
          )}
          {showHeaderMenu && (
            <ProductCardMenu
              onRemove={() => handleRemove?.call(null, cardIndex)}
              isDataVisible={showJson}
              onShowData={() => handleShowJson(true)}
              onHideData={() => handleShowJson(false)}
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
