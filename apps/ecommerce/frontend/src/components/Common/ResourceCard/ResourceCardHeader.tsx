import { Badge, Box, Flex, Text, IconButton } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { styles } from './ResourceCard.styles';
import ResourceCardMenu from './ResourceCardMenu';

interface Props {
  headerTitle: string;
  status: string;
  handleRemove: (index: number) => void;
  showJson: boolean;
  handleShowJson: (show: boolean) => void;
  index: number;
  total: number;
  externalResourceLink: string;
  handleMoveToBottom: Function;
  handleMoveToTop: Function;
  showHeaderMenu: boolean;
}

const ResourceCardHeader = (props: Props) => {
  const {
    externalResourceLink,
    headerTitle,
    status,
    handleRemove,
    showJson,
    handleShowJson,
    index,
    total,
    handleMoveToBottom,
    handleMoveToTop,
    showHeaderMenu,
  } = props;

  return (
    <Box paddingLeft="spacingM" className={styles.resourceCardHeader}>
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
          {externalResourceLink && (
            <IconButton
              variant="transparent"
              aria-label="View external resource details"
              size="small"
              icon={<ExternalLinkIcon />}
            />
          )}
          {showHeaderMenu && (
            <ResourceCardMenu
              onRemove={() => handleRemove(index)}
              isDataVisible={showJson}
              onShowData={() => handleShowJson(true)}
              onHideData={() => handleShowJson(false)}
              index={index}
              total={total}
              onMoveToBottom={() => handleMoveToBottom?.call(null, index)}
              onMoveToTop={() => handleMoveToTop?.call(null, index)}
            />
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default ResourceCardHeader;
