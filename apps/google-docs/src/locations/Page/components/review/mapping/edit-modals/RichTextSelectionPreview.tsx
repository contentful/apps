import { Box, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { NormalizedDocument, SourceRef } from '@types';
import { isBlockImageSourceRef, isTableImageSourceRef, isTextSourceRef } from '@types';

interface RichTextSelectionPreviewProps {
  document: NormalizedDocument;
  sourceRefs: SourceRef[];
  showTablePlaceholder?: boolean;
}

function getTextPreview(sourceRef: SourceRef): string {
  if (isTextSourceRef(sourceRef)) {
    return sourceRef.flattenedRuns.map((run) => run.text).join('');
  }

  return '';
}

function getImageForSourceRef(document: NormalizedDocument, sourceRef: SourceRef) {
  if (!isBlockImageSourceRef(sourceRef) && !isTableImageSourceRef(sourceRef)) {
    return undefined;
  }

  return document.images?.find((image) => image.id === sourceRef.imageId);
}

export const RichTextSelectionPreview = ({
  document,
  sourceRefs,
  showTablePlaceholder = false,
}: RichTextSelectionPreviewProps): JSX.Element => {
  return (
    <Flex flexDirection="column" gap="spacingXs">
      {sourceRefs.map((sourceRef, index) => {
        if (isBlockImageSourceRef(sourceRef) || isTableImageSourceRef(sourceRef)) {
          const image = getImageForSourceRef(document, sourceRef);
          const title = image?.title ?? image?.altText ?? image?.fileName ?? sourceRef.imageId;

          return (
            <Box
              key={`${index}-${title}`}
              style={{
                border: `1px dashed ${tokens.gray400}`,
                borderRadius: tokens.borderRadiusMedium,
                backgroundColor: tokens.gray100,
                padding: tokens.spacingS,
              }}>
              <Text as="p" fontSize="fontSizeS" fontColor="gray700" marginBottom="none">
                <Text as="span">Image: </Text>
                {title}
              </Text>
            </Box>
          );
        }

        const text = getTextPreview(sourceRef);
        if (!text.trim().length) {
          return null;
        }

        return (
          <Text
            key={`${index}-${text.slice(0, 24)}`}
            as="p"
            marginBottom="none"
            fontColor="gray900">
            {text}
          </Text>
        );
      })}
      {showTablePlaceholder ? (
        <Box
          style={{
            border: `1px dashed ${tokens.gray400}`,
            borderRadius: tokens.borderRadiusMedium,
            backgroundColor: tokens.gray100,
            padding: tokens.spacingS,
          }}>
          <Text as="p" marginBottom="none" fontSize="fontSizeS" fontColor="gray700">
            Table content
          </Text>
        </Box>
      ) : null}
    </Flex>
  );
};
