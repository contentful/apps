import type { FC } from 'react';
import * as React from 'react';
import { useState } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import { SkeletonContainer, SkeletonImage } from '@contentful/f36-components';
import { AssetIcon } from '@contentful/f36-icons';

type ImageSize = {
  width: string;
  height: string;
};

type Props = {
  alt?: string;
  src?: string;
} & ImageSize;

const styles = {
  imgWrapper: ({ width, height, loaded }: ImageSize & { loaded: boolean }) =>
    css({
      height: loaded ? height : '0px',
      width: loaded ? width : '0px',
      position: 'relative',
      overflow: 'hidden',
    }),
  previewImg: css({
    height: '100%',
    minWidth: 'auto',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }),
  skeletonImage: css({
    width: '100%',
    height: '100%',
  }),
  errorImage: css({
    backgroundColor: tokens.gray100,
    width: '100%',
    height: '100%',
    position: 'relative',
    svg: css({
      fill: tokens.gray600,
      width: '100%',
      height: '50%',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }),
  }),
};

export const ProductImage: FC<Props> = ({ src, alt, width, height }) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div style={{ width, height }}>
      {!loaded && !hasError && (
        <SkeletonContainer className={styles.skeletonImage}>
          <SkeletonImage width={width} height={height} />
        </SkeletonContainer>
      )}

      {hasError && (
        <div className={styles.errorImage}>
          <AssetIcon />
        </div>
      )}

      {!hasError && (
        <div className={styles.imgWrapper({ height, width, loaded })}>
          {/* eventually replaced by https://f36.contentful.com/components/image */}
          <img
            style={{ display: loaded ? 'block' : 'none' }}
            onLoad={() => setLoaded(true)}
            className={styles.previewImg}
            onError={() => setHasError(true)}
            data-test-id="product-image"
            src={src}
            alt={alt}
          />
        </div>
      )}
    </div>
  );
};

ProductImage.defaultProps = { width: '100px', height: '100px' };
