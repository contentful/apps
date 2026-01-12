import { Card, Flex, Heading, Skeleton } from '@contentful/f36-components';
import { styles } from './LoadingSkeleton.styles';

export const LoadingSkeleton = ({ metricsCount }: { metricsCount: number }) => {
  return (
    <Flex flexDirection="column" gap="spacingL">
      {/* Metric Cards Section */}
      <Flex flexDirection="row" gap="spacingXl">
        {Array.from({ length: metricsCount }).map((_, index) => {
          return (
            <Card key={index} style={styles.metricCard}>
              <Skeleton.Container>
                <Skeleton.Image width="100%" height="110px" />
              </Skeleton.Container>
            </Card>
          );
        })}
      </Flex>

      {/* Content Publishing Trends Section */}
      <Card padding="default" style={styles.sectionCard}>
        <Heading marginBottom="spacing2Xl">Content Publishing Trends</Heading>
        <Skeleton.Container>
          <Skeleton.Image width="100%" height="100px" />
        </Skeleton.Container>
      </Card>

      {/* Upcoming Scheduled Releases Section */}
      <Card padding="default" style={styles.sectionCard}>
        <Heading marginBottom="spacing2Xl">Upcoming Scheduled Releases</Heading>
        <Skeleton.Container>
          <Skeleton.Image width="100%" height="100px" />
        </Skeleton.Container>
      </Card>
    </Flex>
  );
};
