import { Card, Flex, Skeleton, Subheading } from '@contentful/f36-components';
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
        <Subheading marginBottom="spacing2Xl">Content Publishing Trends</Subheading>
        <Skeleton.Container>
          <Skeleton.Image width="100%" height="100px" />
        </Skeleton.Container>
      </Card>

      {/* Upcoming Scheduled Releases Section */}
      <Card padding="default" style={styles.sectionCard}>
        <Subheading marginBottom="spacing2Xl">Upcoming Scheduled Releases</Subheading>
        <Skeleton.Container>
          <Skeleton.Image width="100%" height="100px" />
        </Skeleton.Container>
      </Card>

      {/* Scheduled Content Section */}
      <Card padding="default" style={styles.sectionCard}>
        <Skeleton.Container>
          <Skeleton.Image width="100%" height="100px" />
        </Skeleton.Container>
      </Card>
    </Flex>
  );
};
