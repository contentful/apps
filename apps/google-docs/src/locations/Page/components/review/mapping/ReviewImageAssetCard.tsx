import { Box, Card, Image, MenuItem } from '@contentful/f36-components';
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
  size?: 'small' | 'default';
  readOnly?: boolean;
  showReadOnlyHighlightBorder?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onAssign: () => void;
  onExclude: () => void;
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
  size = 'default',
  readOnly = false,
  showReadOnlyHighlightBorder = false,
  onMouseEnter,
  onMouseLeave,
  onAssign,
  onExclude,
}: ReviewImageAssetCardProps): JSX.Element {
  const title = getNormalizedImageDisplayName(image);
  const assignLabel = isHighlighted ? 'Reassign' : 'Assign';

  const imageHeight = size === 'small' ? '180px' : '280px';

  const borderColor =
    isExcluded || !isHighlighted ? tokens.gray300 : hovered ? tokens.green600 : tokens.green500;
  const showReadOnlyBorder =
    !readOnly || isExcluded || !isHighlighted || showReadOnlyHighlightBorder;

  return (
    <Box
      data-review-alignment-target={
        readOnly && isHighlighted && showReadOnlyHighlightBorder ? 'true' : undefined
      }
      data-testid={`review-image-asset-${buildSourceRefKey(sourceRef)}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        opacity: isExcluded && !isHighlighted ? 0.55 : 1,
        display: 'inline-block',
        maxWidth: '100%',
        verticalAlign: 'top',
        borderRadius: tokens.borderRadiusMedium,
        border: showReadOnlyBorder ? `2px solid ${borderColor}` : '2px solid transparent',
        backgroundColor: isHighlighted
          ? readOnly
            ? 'transparent'
            : tokens.green100
          : tokens.gray100,
        transition: 'border-color 120ms ease',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: tokens.spacingXs,
      }}>
      <Card
        ariaLabel={title}
        actions={
          readOnly
            ? undefined
            : [
                <MenuItem key="assigned" onClick={onAssign}>
                  {assignLabel}
                </MenuItem>,
                <MenuItem key="exclude" onClick={onExclude} isDisabled={!isHighlighted}>
                  Exclude
                </MenuItem>,
              ]
        }>
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
