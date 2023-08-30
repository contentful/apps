import { SortableContainer } from 'react-sortable-hoc';
import { DeleteFn, Product } from '../types';
import { SortableListItem } from './SortableListItem';

export interface Props {
  disabled: boolean;
  productPreviews: Product[];
  deleteFn: DeleteFn;
  skuType?: string;
}

export const SortableList = SortableContainer<Props>(
  ({ disabled, deleteFn, productPreviews, skuType }: Props) => {
    const itemsAreSortable = productPreviews.length > 1;
    return (
      <div>
        {productPreviews.map((product, index) => {
          return (
            <SortableListItem
              disabled={disabled}
              key={`${product.image}-${product.sku}`}
              product={product}
              index={index}
              onDelete={() => deleteFn(index)}
              isSortable={itemsAreSortable}
              skuType={skuType}
            />
          );
        })}
      </div>
    );
  }
);
