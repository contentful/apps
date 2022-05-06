import {
  Badge,
  Card,
  Heading,
  IconButton,
  SkeletonContainer,
  SkeletonImage,
  Subheading,
} from '@contentful/f36-components';
import { AssetIcon, CloseIcon, ErrorCircleIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import React, { ReactElement, useState } from 'react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Product } from '../interfaces';

export interface Props {
  product: Product;
  disabled: boolean;
  onDelete: () => void;
  isSortable: boolean;
  skuType?: string;
}

const IMAGE_SIZE = 48;

const styles = {
  card: css({
    padding: 0,
    position: 'relative',
    ':not(:first-of-type)': css({
      marginTop: tokens.spacingXs,
    }),
  }),
  cardInner: css({
    display: 'flex',
  }),
  imageWrapper: (imageHasLoaded: boolean) =>
    css({
      width: imageHasLoaded ? `${IMAGE_SIZE}px` : 0,
      height: imageHasLoaded ? `${IMAGE_SIZE}px` : 0,
      overflow: 'hidden',
      margin: imageHasLoaded ? tokens.spacingM : 0,
      position: 'relative',
      '> img': css({
        display: 'block',
        height: `${IMAGE_SIZE}px`,
        minWidth: 'auto',
        userSelect: 'none',
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }),
    }),
  dragHandle: css({
    height: 'auto',
    borderBottomLeftRadius: tokens.borderRadiusMedium,
    borderTopLeftRadius: tokens.borderRadiusMedium,
    cursor: 'grab',
  }),
  actions: css({
    position: 'absolute',
    top: tokens.spacingXs,
    right: tokens.spacingXs,
    a: css({
      display: 'inline-block',
      marginRight: tokens.spacingXs,
      svg: css({
        transition: `fill ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
      }),
      '&:hover': {
        svg: css({
          fill: tokens.colorBlack,
        }),
      },
    }),
  }),
  description: css({
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  }),
  name: (name?: string) =>
    css({
      fontSize: tokens.fontSizeL,
      marginBottom: tokens.spacing2Xs,
      ...(name && { textTransform: 'capitalize' }),
    }),
  sku: css({
    color: tokens.gray500,
    fontSize: tokens.fontSizeS,
    marginBottom: 0,
  }),
  skeletonImage: css({
    width: `${IMAGE_SIZE}px`,
    height: `${IMAGE_SIZE}px`,
    padding: tokens.spacingM,
  }),
  errorImage: css({
    backgroundColor: tokens.gray100,
    borderRadius: '3px',
    margin: tokens.spacingM,
    width: `${IMAGE_SIZE}px`,
    height: `${IMAGE_SIZE}px`,
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

const CardDragHandle = SortableHandle(({ drag }: { drag: ReactElement }) => <>{drag}</>);

export const SortableListItem = SortableElement<Props>(
  ({ product, disabled, isSortable, onDelete, skuType }: Props) => {
    const [imageHasLoaded, setImageLoaded] = useState(false);
    const [imageHasErrored, setImageHasErrored] = useState(false);
    const productIsMissing = !product.name;

    return (
      <Card
        data-testid="sortable-list-item"
        className={styles.card}
        // @ts-ignore
        withDragHandle
        dragHandleRender={isSortable ? ({ drag }) => <CardDragHandle drag={drag} /> : undefined}
      >
        <div className={styles.cardInner}>
          {!imageHasLoaded && !imageHasErrored && product.image && (
            <SkeletonContainer className={styles.skeletonImage}>
              <SkeletonImage width={IMAGE_SIZE} height={IMAGE_SIZE} />
            </SkeletonContainer>
          )}
          {!product.image || imageHasErrored ? (
            <div className={styles.errorImage}>
              {productIsMissing ? (
                <ErrorCircleIcon testId="error-circle-icon" />
              ) : (
                <AssetIcon testId="asset-icon" />
              )}
            </div>
          ) : (
            <div className={styles.imageWrapper(imageHasLoaded)}>
              <img
                style={{ display: imageHasLoaded ? 'block' : 'none' }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageHasErrored(true)}
                src={product.image}
                alt={product.name}
                data-test-id="image"
              />
            </div>
          )}
          <section className={styles.description}>
            <Heading className={styles.name(product.name)}>
              {productIsMissing ? product.sku : product.name}
            </Heading>
            {productIsMissing ? (
              <Badge variant="negative">{skuType ?? 'Product'} missing</Badge>
            ) : (
              <Subheading className={styles.sku}>{product.displaySKU ?? product.sku}</Subheading>
            )}
          </section>
        </div>
        {!disabled && (
          <div className={styles.actions}>
            {product.externalLink && (
              <a target="_blank" rel="noopener noreferrer" href={product.externalLink}>
                <ExternalLinkIcon color="muted" />
              </a>
            )}
            <IconButton
              aria-label="Delete"
              icon={<CloseIcon />}
              variant="transparent"
              onClick={onDelete}
            />
          </div>
        )}
      </Card>
    );
  }
);
