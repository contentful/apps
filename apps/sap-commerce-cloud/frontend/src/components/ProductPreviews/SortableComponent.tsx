import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FieldAppSDK } from '@contentful/app-sdk';
import { mapSort } from '@utils';
import { SortableList } from '@components/ProductPreviews/SortableList';
import { Product, PreviewsFn } from '@interfaces';
import { isEqual } from 'lodash';

interface Props {
  sdk: FieldAppSDK;
  disabled: boolean;
  onChange: (skus: string[]) => void;
  skus: string[];
  fetchProductPreviews: PreviewsFn;
}

/**
 * @description - helper function to compare two lists of skus for order agnostic equality
 */
const skusAreEqual = (prevSkus: string[], currentSkus: string[]): boolean => {
  const sortedPreviousSkus = [...prevSkus].sort();
  const sortedCurrentSkus = [...currentSkus].sort();
  return !isEqual(sortedPreviousSkus, sortedCurrentSkus);
};

/**
 * @description - hook to track previous version of skus prop
 * @param skus - list of most current skus
 * @returns previous list of skus
 */
const usePreviousSkus = (skus: string[]) => {
  const skusRef = useRef<string[]>([]);

  useEffect(() => {
    skusRef.current = skus;
  }, [skus]);

  return skusRef.current;
};

export function SortableComponent({ sdk, disabled, onChange, skus, fetchProductPreviews }: Props) {
  const [productPreviews, setProductPreviews] = useState<Product[]>([]);
  const previousSkus = usePreviousSkus(skus);

  const getProductPreviews = useCallback(async () => {
    try {
      const shouldRefetch = skusAreEqual([...previousSkus], [...skus]);

      if (shouldRefetch) {
        const productPreviewsUnsorted = await fetchProductPreviews(skus);
        const sortedProductPreviews = mapSort(productPreviewsUnsorted, skus, 'productUrl');
        setProductPreviews(sortedProductPreviews);
      }
    } catch (error) {
      sdk.notifier.error('There was an error fetching the data for the selected products.');
    }
  }, [skus, fetchProductPreviews, setProductPreviews, sdk.notifier, previousSkus]);

  /**
   * @description - Compare previous list of skus (see `usePreviousSkus`) to the list of skus
   * passed as a prop.  If the previous & current skus differ (a sku was added/removed, order agnostic),
   * then fetch/refetch associated productPreviews given list of skus.
   */
  useEffect(() => {
    const shouldRefetch = skusAreEqual([...previousSkus], [...skus]);

    if (shouldRefetch) {
      getProductPreviews();
    }
  }, [skus, getProductPreviews, previousSkus]);

  const deleteItem = useCallback(
    (index: number) => {
      const newSkus = [...skus];
      newSkus.splice(index, 1);
      onChange(newSkus);
    },
    [onChange, skus]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = productPreviews.findIndex((product) => product.productUrl === active.id);
        const newIndex = productPreviews.findIndex((product) => product.productUrl === over?.id);
        const sortedProductPreviews: Product[] = arrayMove(productPreviews, oldIndex, newIndex);

        onChange(sortedProductPreviews.map((p) => p.productUrl));
        setProductPreviews(sortedProductPreviews);
      }
    },
    [productPreviews, onChange, setProductPreviews]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={productPreviews.map((p) => p.productUrl)}
        strategy={verticalListSortingStrategy}>
        <SortableList disabled={disabled} productPreviews={productPreviews} deleteFn={deleteItem} />
      </SortableContext>
    </DndContext>
  );
}
