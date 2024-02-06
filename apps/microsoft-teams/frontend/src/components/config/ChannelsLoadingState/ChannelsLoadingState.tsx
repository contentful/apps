import { Flex, Skeleton, Table } from '@contentful/f36-components';
import { styles } from './ChannelsLoadingState.styles';
import tokens from '@contentful/f36-tokens';

// numbers as determined by designs
const SVG_HEIGHT = 52;
const SVG_WIDTH = 340;
const OFFSET_TOP = 26;

const SkeletonContainer = () => (
  <Skeleton.Container svgHeight={SVG_HEIGHT} svgWidth={SVG_WIDTH}>
    <Skeleton.BodyText radiusX={tokens.borderRadiusMedium} numberOfLines={1} />
    <Skeleton.BodyText
      radiusX={tokens.borderRadiusMedium}
      numberOfLines={1}
      offsetTop={OFFSET_TOP}
    />
  </Skeleton.Container>
);

const ChannelsLoadingState = () => {
  return (
    <Flex data-testId="channels-loading" flexDirection="column" alignItems="center">
      <Table className={styles.table}>
        <Table.Body>
          <Table.Row className={styles.tableRow}>
            <Table.Cell className={styles.tableCell}>
              <SkeletonContainer />
            </Table.Cell>
          </Table.Row>
          <Table.Row className={styles.tableRow}>
            <Table.Cell className={styles.tableCell}>
              <SkeletonContainer />
            </Table.Cell>
          </Table.Row>
          <Table.Row className={styles.tableRow}>
            <Table.Cell className={styles.tableCell}>
              <SkeletonContainer />
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </Flex>
  );
};

export default ChannelsLoadingState;
