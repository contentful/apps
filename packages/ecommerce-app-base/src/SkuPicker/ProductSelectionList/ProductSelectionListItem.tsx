import * as React from 'react';
import { useState } from 'react';
import tokens from '@contentful/f36-tokens';
import noop from 'lodash/noop';
import { css } from '@emotion/css';
import { Product } from '../../types';

import { Icon, Tooltip } from '@contentful/f36-components';

import { AssetIcon, CloseIcon, ErrorCircleIcon } from '@contentful/f36-icons';

export interface Props {
  product: Product;
  selectProduct: (sku: string) => void;
}

const styles = {
  productWrapper: css({
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
    ':not(:first-of-type)': css({
      marginLeft: tokens.spacingXs,
    }),
    '&:last-child': css({
      marginRight: tokens.spacingXs,
    }),
  }),
  product: css({
    border: '1px solid',
    borderColor: tokens.gray200,
    borderRadius: '3px',
    display: 'flex',
    flexDirection: 'column',
    height: '40px',
    width: '40px',
    overflow: 'hidden',
    outline: 0,
    textAlign: 'center',
    transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
    position: 'relative',
    transform: 'translateZ(0)', // Force hardware acceleration for transitions
    willChange: 'box-shadow, border-color',
    '&:hover': {
      borderColor: tokens.gray500,
      cursor: 'pointer',
      '> span > div': {
        opacity: 1,
      },
    },
  }),
  previewImg: (imageHasLoaded: boolean) =>
    css({
      display: imageHasLoaded ? 'block' : 'none',
      margin: '0 auto',
      minWidth: 'auto',
      height: '40px',
      overflow: 'hidden',
    }),
  removeIcon: css({
    backgroundColor: 'rgba(0,0,0,.65)',
    borderRadius: '50%',
    color: 'white',
    opacity: 0,
    width: '28px',
    height: '28px',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    transition: `opacity ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
    svg: css({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }),
  }),
  errorImage: css({
    backgroundColor: tokens.gray100,
    width: '100%',
    height: '40px',
    position: 'relative',
    zIndex: -1,
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

export const ProductSelectionListItem = (props: Props) => {
  const [imageHasLoaded, setImageHasLoaded] = useState(false);
  const [imageHasErrored, setImageHasErrored] = useState(false);
  const { product, selectProduct } = props;
  const productIsMissing = !product.name;

  return (
    <div className={styles.productWrapper} data-test-id="product-selection-list-item">
      <div
        role="switch"
        aria-checked={true}
        tabIndex={-1}
        className={styles.product}
        onKeyUp={noop}
        data-test-id={`selection-preview-${product.sku}`}
        onClick={() => selectProduct(product.sku)}>
        <Tooltip content={productIsMissing ? 'Product missing' : product.name} placement="bottom">
          <div className={styles.removeIcon}>
            <CloseIcon variant="white" />
          </div>
          {imageHasErrored && (
            <div className={styles.errorImage}>
              <Icon as={productIsMissing ? ErrorCircleIcon : AssetIcon} />
            </div>
          )}
          {!imageHasErrored && (
            <img
              alt="product preview"
              className={styles.previewImg(imageHasLoaded)}
              data-test-id="image"
              onError={() => setImageHasErrored(true)}
              onLoad={() => setImageHasLoaded(true)}
              src={product.image}
            />
          )}
        </Tooltip>
      </div>
    </div>
  );
};
