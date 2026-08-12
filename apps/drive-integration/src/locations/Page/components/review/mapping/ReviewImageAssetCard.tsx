import { Box, Card, Flex, Image, MenuItem, Text } from '@contentful/f36-components';
import { PencilSimpleIcon, TrashSimpleIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import type { ImageSourceRef, NormalizedDocumentImage } from '@types';
import Splitter from '../../mainpage/Splitter';
import { buildSourceRefKey } from './sourceRefUtils';

export interface ReviewImageAssetCardProps {
  image: NormalizedDocumentImage;
  sourceRef: ImageSourceRef;
  isHighlighted: boolean;
  /** When the mapping rail highlights this image (same as plain `img` hover). */
  hovered?: boolean;
  isExcluded: boolean;
  /** When true, render a green border without a green fill for highlighted mappings. */
  isViewMode?: boolean;
  size?: 'small' | 'default';
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}

export function getNormalizedImageDisplayName(image: NormalizedDocumentImage): string {
  return image.title ?? image.altText ?? image.fileName ?? 'Document image';
}

export function ReviewImageAssetCard({
  image,
  sourceRef,
  isHighlighted,
  hovered = false,
  isExcluded,
  isViewMode = false,
  size = 'default',
  onMouseEnter,
  onMouseLeave,
  onEdit,
  onRemove,
}: ReviewImageAssetCardProps): JSX.Element {
  const title = getNormalizedImageDisplayName(image);

  const imageHeight = size === 'small' ? '180px' : '280px';

  // View mode: highlighted images use a green border with no fill; unmapped images are unchanged.
  // Edit mode (default): highlighted images use a green fill with transparent border.
  const backgroundColor = isViewMode
    ? tokens.gray100
    : isHighlighted
    ? hovered
      ? tokens.green300
      : tokens.green100
    : tokens.gray100;

  const border = isViewMode
    ? isHighlighted
      ? `${hovered ? 2 : 1}px solid ${hovered ? tokens.green600 : tokens.green500}`
      : `1px solid ${tokens.gray300}`
    : `1px solid ${isHighlighted ? 'transparent' : tokens.gray300}`;

  const cardActions = [
    onEdit ? (
      <MenuItem key="edit" onClick={onEdit}>
        <Flex alignItems="center" gap="spacing2Xs">
          <PencilSimpleIcon size="tiny" />
          <Text>Edit content mapping</Text>
        </Flex>
      </MenuItem>
    ) : null,
    onRemove ? (
      <MenuItem key="remove" onClick={onRemove}>
        <Flex alignItems="center" gap="spacing2Xs">
          <TrashSimpleIcon size="tiny" color={tokens.red600} />
          <Text fontColor="red600">Remove</Text>
        </Flex>
      </MenuItem>
    ) : null,
  ].filter((action): action is JSX.Element => action !== null);

  return (
    <Box
      data-testid={`review-image-asset-${buildSourceRefKey(sourceRef)}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        opacity: isExcluded && !isHighlighted ? 0.55 : 1,
        display: 'inline-block',
        maxWidth: '100%',
        verticalAlign: 'top',
        borderRadius: tokens.borderRadiusMedium,
        border,
        backgroundColor,
        transition: 'background-color 120ms ease, border-color 120ms ease',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: tokens.spacingXs,
      }}>
      <Card ariaLabel={title} actions={cardActions.length ? cardActions : undefined}>
        <Splitter />
        <Box padding="spacingS">
          <Image
            alt={title}
            height={imageHeight}
            width="100%"
            src={image.url}
            referrerPolicy="no-referrer"
            style={{
              display: 'block',
              maxWidth: '100%',
              height: imageHeight,
              width: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
      </Card>
    </Box>
  );
}
