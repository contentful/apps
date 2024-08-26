import { DeleteFn, Product } from '@interfaces';
import { SortableListItem } from '@components/ProductPreviews/SortableListItem';
import { styles } from '@components/ProductPreviews/SortableList.styles';

export interface Props {
  disabled: boolean;
  productPreviews: Product[];
  deleteFn: DeleteFn;
}

export function SortableList({ disabled, deleteFn, productPreviews = [] }: Props) {
  const itemsAreSortable = productPreviews.length > 1;

  return (
    <div className={styles.container}>
      {productPreviews.map((product, index) => {
        return (
          <SortableListItem
            disabled={disabled}
            key={`${product.image}-${product.sku}`}
            product={product}
            onDelete={() => deleteFn(index)}
            isSortable={itemsAreSortable}
          />
        );
      })}
    </div>
  );
}
