import { FC, useState, useEffect, useCallback, useRef } from 'react';
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
import { mapSort } from '../utils';
import { SortableList } from './SortableList';
import { Config, Product, ProductPreviewsFn } from '../types';
import { isEqual } from 'lodash';

interface Props {
  sdk: FieldAppSDK;
  disabled: boolean;
  onChange: (skus: string[]) => void;
  config: Config;
  skus: string[];
  fetchProductPreviews: ProductPreviewsFn;
  skuType?: string;
}

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

export const SortableComponent: FC<Props> = ({
  sdk,
  disabled,
  onChange,
  config,
  skus,
  fetchProductPreviews,
  skuType,
}) => {
  const [productPreviews, setProductPreviews] = useState<Product[]>([]);
  const previousSkus = usePreviousSkus(skus);

  const getProductPreviews = useCallback(
    async (shouldRefetch: boolean = true) => {
      try {
        const productPreviewsUnsorted = shouldRefetch
          ? await fetchProductPreviews(skus, config, skuType)
          : productPreviews;
        const sortedProductPreviews = mapSort(productPreviewsUnsorted, skus, 'sku');
        setProductPreviews(sortedProductPreviews);
      } catch (error) {
        sdk.notifier.error('There was an error fetching the data for the selected products.');
      }
    },
    [skus, skuType, config, fetchProductPreviews, setProductPreviews, sdk.notifier, productPreviews]
  );

  useEffect(() => {
    // only refetch product previews if new skus do not match previous skus
    const sortedPreviousSkus = previousSkus.sort();
    const sortedCurrentSkus = skus.sort();
    const shouldRefetch = !isEqual(sortedPreviousSkus, sortedCurrentSkus);

    getProductPreviews(shouldRefetch);
  }, [skus, skuType, config, getProductPreviews, previousSkus]);

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
        const oldIndex = productPreviews.findIndex((product) => product.id === active.id);
        const newIndex = productPreviews.findIndex((product) => product.id === over?.id);
        const sortedProductPreviews: Product[] = arrayMove(productPreviews, oldIndex, newIndex);

        onChange(sortedProductPreviews.map((p) => p.sku));
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
        items={productPreviews.map((p) => p.id)}
        strategy={verticalListSortingStrategy}>
        <SortableList
          disabled={disabled}
          productPreviews={productPreviews}
          deleteFn={deleteItem}
          skuType={skuType}
        />
      </SortableContext>
    </DndContext>
  );
};
