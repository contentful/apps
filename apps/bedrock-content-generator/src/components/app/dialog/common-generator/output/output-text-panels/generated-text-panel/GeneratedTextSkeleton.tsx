import { SkeletonContainer, SkeletonBodyText } from '@contentful/f36-components';
import { styles } from './GeneratedTextSkeleton.styles';

/**
 * Placeholder shown while Bedrock generates content. Renders grey pulsing lines
 * (Forma 36's skeleton loader) that stand in for the text about to appear.
 */
const GeneratedTextSkeleton = () => {
  return (
    <SkeletonContainer
      testId="generated-text-skeleton"
      ariaLabel="Generating content…"
      svgHeight={110}
      css={styles.skeleton}>
      <SkeletonBodyText numberOfLines={5} marginBottom={12} offsetTop={4} />
    </SkeletonContainer>
  );
};

export default GeneratedTextSkeleton;
