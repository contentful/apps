import { FC, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '../../interfaces';
import {
  AssetIcon,
  Badge,
  Card,
  Flex,
  Heading,
  SkeletonContainer,
  SkeletonImage,
  Subheading,
} from '@contentful/f36-components';
import { IconButton } from '@contentful/f36-button';
import tokens from '@contentful/f36-tokens';
import { styles } from './SortableListItem.styles';
import { CloseIcon, ErrorCircleIcon, ExternalLinkIcon } from '@contentful/f36-icons';

export interface Props {
  product: Product;
  disabled: boolean;
  onDelete: () => void;
  isSortable: boolean;
}

const IMAGE_SIZE = 48;

export const SortableListItem: FC<Props> = ({ product, disabled, onDelete, isSortable }: Props) => {
  const [imageHasLoaded, setImageLoaded] = useState(false);
  const [imageHasErrored, setImageHasErrored] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: product.productUrl,
  });

  const style = isSortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        marginTop: tokens.spacingS,
      }
    : { marginTop: tokens.spacingS };

  return (
    <div
      ref={setNodeRef}
      style={style}
      key={product.id}
      {...attributes}
      {...listeners}
      data-testid={`sortable-item-${product.id}`}>
      <Card withDragHandle={isSortable} className={styles.card} data-testid="sortable-list-item">
        <Flex>
          {!imageHasLoaded && !imageHasErrored && (
            <SkeletonContainer className={styles.skeletonImage}>
              <SkeletonImage width={IMAGE_SIZE} height={IMAGE_SIZE} />
            </SkeletonContainer>
          )}
          {imageHasErrored && (
            <div className={styles.errorImage}>
              {product.isMissing ? (
                <ErrorCircleIcon data-testid="icon" />
              ) : (
                <AssetIcon data-testid="icon" />
              )}
            </div>
          )}
          {!imageHasErrored && (
            <div className={styles.imageWrapper(imageHasLoaded)}>
              <img
                style={{ display: imageHasLoaded ? 'block' : 'none' }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageHasErrored(true)}
                src={product.image}
                alt={product.name}
                data-testid="image"
              />
            </div>
          )}
          <section className={styles.description}>
            <Heading className={styles.heading(product)}>
              {product.isMissing || !product.name ? product.sku : product.name}
            </Heading>
            {product.isMissing && <Badge variant="negative">Product missing</Badge>}
            {!product.isMissing && product.name && (
              <Subheading className={styles.subheading}>{product.sku}</Subheading>
            )}
          </section>
          {!disabled && (
            <div className={styles.actions}>
              {product.externalLink && (
                <a target="_blank" rel="noopener noreferrer" href={product.externalLink}>
                  <ExternalLinkIcon variant="muted" />
                </a>
              )}
              <IconButton
                icon={<CloseIcon variant="muted" />}
                aria-label="Delete"
                onClick={onDelete}
              />
            </div>
          )}
        </Flex>
      </Card>
    </div>
  );
};
