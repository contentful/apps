import { Flex, Skeleton } from '@contentful/f36-components';

export const LoadingSkeleton = () => {
  return (
    <Flex flexDirection="column" margin="spacingXl">
      <Skeleton.Container svgHeight={500}>
        <Skeleton.Text numberOfLines={4} lineHeight={100} />
      </Skeleton.Container>
    </Flex>
  );
};
