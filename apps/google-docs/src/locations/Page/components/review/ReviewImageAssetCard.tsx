import { Box, Card, Image, MenuItem } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { ImageSourceRef, NormalizedDocumentImage } from '@types';
import { getNormalizedImageDisplayName } from './utils/normalizedImageDisplayName';
import { getSourceRefKey } from './utils/sourceRefReview';
import Splitter from '../mainpage/Splitter';

export interface ReviewImageAssetCardProps {
  image: NormalizedDocumentImage;
  sourceRef: ImageSourceRef;
  isHighlighted: boolean;
  /** When the mapping rail highlights this image (same as plain `img` hover). */
  hovered?: boolean;
  isExcluded: boolean;
  size?: 'small' | 'default';
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onAssign: () => void;
  onExclude: () => void;
}

export function ReviewImageAssetCard({
  image,
  sourceRef,
  isHighlighted,
  hovered = false,
  isExcluded,
  size = 'default',
  onMouseEnter,
  onMouseLeave,
  onAssign,
  onExclude,
}: ReviewImageAssetCardProps): JSX.Element {
  const title = getNormalizedImageDisplayName(image);

  const imageHeight = size === 'small' ? '180px' : '280px';

  const borderColor =
    isExcluded || !isHighlighted ? tokens.gray300 : hovered ? tokens.green600 : tokens.green500;

  return (
    <Box
      data-testid={`review-image-asset-${getSourceRefKey(sourceRef)}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        opacity: isExcluded ? 0.55 : 1,
        display: 'inline-block',
        maxWidth: '100%',
        verticalAlign: 'top',
        borderRadius: tokens.borderRadiusMedium,
        border: `2px solid ${borderColor}`,
        backgroundColor: isHighlighted ? tokens.green100 : tokens.gray100,
        transition: 'border-color 120ms ease',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: tokens.spacingXs,
      }}>
      <Card
        ariaLabel={title}
        actions={[
          <MenuItem key="assigned" onClick={onAssign}>
            Assign
          </MenuItem>,
          <MenuItem key="exclude" onClick={onExclude}>
            Exclude
          </MenuItem>,
        ]}>
        <Splitter />
        <Box padding="spacingS">
          <Image
            alt={title}
            height={imageHeight}
            width="auto"
            src={image.url}
            referrerPolicy="no-referrer"
            style={{
              display: 'block',
              maxWidth: '100%',
              height: imageHeight,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </Box>
      </Card>
    </Box>
  );
}
