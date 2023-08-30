import * as React from 'react';
import { FC, ReactElement } from 'react';
import { Badge, Card, Heading, IconButton, Subheading } from '@contentful/f36-components';
import { CloseIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import type { Product } from '../../types';
import { SortableHandle } from 'react-sortable-hoc';
import { ProductImage } from '../ProductImage';

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
  imgWrapper: css({
    margin: tokens.spacingM,
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

export interface Props {
  product: Product;
  disabled: boolean;
  onDelete: () => void;
  isSortable: boolean;
  skuType?: string;
}

const CardDragHandle = SortableHandle(({ drag }: { drag: ReactElement }) => <>{drag}</>);

export const LegacyProductCard: FC<Props> = ({
  product,
  isSortable,
  disabled,
  onDelete,
  skuType,
}) => {
  const productIsMissing = !product.name;

  return (
    <Card
      data-test-id="sortable-list-item"
      className={styles.card}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      withDragHandle
      dragHandleRender={isSortable ? ({ drag }) => <CardDragHandle drag={drag} /> : undefined}>
      <div className={styles.cardInner}>
        <ProductImage
          className={styles.imgWrapper}
          src={product.image}
          alt={product.name}
          width={`${IMAGE_SIZE}px`}
          height={`${IMAGE_SIZE}px`}
        />

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
};
