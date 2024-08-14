import { FC, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '../../interfaces';
import {
  Card,
  CardDragHandle as FormaCardDragHandle,
  Heading,
  Icon,
  IconButton,
  SkeletonContainer,
  SkeletonImage,
  Subheading,
  Tag,
  Typography,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { styles } from './SortableListItem.styles';

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
      <Card className={styles.card} data-testid="sortable-list-item">
        <>
          {isSortable && (
            <FormaCardDragHandle className={styles.dragHandle}>Reorder product</FormaCardDragHandle>
          )}
          {!imageHasLoaded && !imageHasErrored && (
            <SkeletonContainer className={styles.skeletonImage}>
              <SkeletonImage width={IMAGE_SIZE} height={IMAGE_SIZE} />
            </SkeletonContainer>
          )}
          {imageHasErrored && (
            <div className={styles.errorImage}>
              <Icon icon={product.isMissing ? 'ErrorCircle' : 'Asset'} data-testid="icon" />
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
            <Typography>
              <Heading className={styles.heading(product)}>
                {product.isMissing || !product.name ? product.sku : product.name}
              </Heading>
              {product.isMissing && <Tag tagType="negative">Product missing</Tag>}
              {!product.isMissing && product.name && (
                <Subheading className={styles.subheading}>{product.sku}</Subheading>
              )}
            </Typography>
          </section>
        </>
        {!disabled && (
          <div className={styles.actions}>
            {product.externalLink && (
              <a target="_blank" rel="noopener noreferrer" href={product.externalLink}>
                <Icon icon="ExternalLink" color="muted" />
              </a>
            )}
            <IconButton
              label="Delete"
              iconProps={{ icon: 'Close' }}
              buttonType="muted"
              onClick={onDelete}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
