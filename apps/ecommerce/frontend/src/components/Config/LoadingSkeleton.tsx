import { Flex, Paragraph, Skeleton } from '@contentful/f36-components';
import { styles } from './ConfigPage.styles';

const LoadingSkeleton = () => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      paddingTop="spacingL"
      paddingRight="spacing3Xl"
      paddingLeft="spacing3Xl"
      className={styles.loadingContainer}>
      <Skeleton.Container ariaLabel="Loading config..." svgWidth="100%" svgHeight="300px">
        <Skeleton.BodyText numberOfLines={5} marginBottom={15} offsetTop={60} />
      </Skeleton.Container>
      <Paragraph className={styles.loadingText}>Loading app configuration...</Paragraph>
    </Flex>
  );
};

export default LoadingSkeleton;
