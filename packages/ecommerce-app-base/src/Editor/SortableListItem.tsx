import { FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import tokens from '@contentful/f36-tokens';
import { LegacyProductCard, ProductCard } from '../ProductCard';
import { useIntegration } from './IntegrationContext';
import { Product } from '../types';

export interface Props {
  product: Product;
  disabled: boolean;
  onDelete: () => void;
  isSortable: boolean;
  skuType?: string;
}

export const SortableListItem: FC<Props> = ({
  product,
  disabled,
  onDelete,
  isSortable,
  skuType,
}: Props) => {
  const { productCardVersion, name } = useIntegration();

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: product.id,
  });

  const style = isSortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        marginTop: tokens.spacingS,
      }
    : { marginTop: tokens.spacingS };

  if (productCardVersion === 'v2') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        key={product.id}
        {...attributes}
        {...listeners}
        data-test-id={`sortable-item-${product.id}`}>
        <ProductCard
          handleRemove={onDelete}
          isSortable={isSortable}
          productCardType={'field'}
          resource={product}
          title={`${name} - ${skuType!}`}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      key={product.id}
      {...attributes}
      {...listeners}
      data-test-id={`sortable-item-${product.id}`}>
      <LegacyProductCard
        product={product}
        disabled={disabled}
        onDelete={onDelete}
        isSortable={isSortable}
      />
    </div>
  );
};
