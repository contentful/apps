import { Flex, SkeletonContainer, SkeletonImage } from '@contentful/f36-components';

export const LoadingSkeleton = () => {
  return (
    <Flex flexDirection="column" gap="spacingXl" margin="spacingXl">
      <SkeletonContainer>
        <SkeletonImage width="100%" height={300} />
      </SkeletonContainer>
      <SkeletonContainer>
        <SkeletonImage width="100%" height={300} />
      </SkeletonContainer>
      <SkeletonContainer>
        <SkeletonImage width="100%" height={300} />
      </SkeletonContainer>
      <SkeletonContainer>
        <SkeletonImage width="100%" height={300} />
      </SkeletonContainer>
    </Flex>
  );
};
