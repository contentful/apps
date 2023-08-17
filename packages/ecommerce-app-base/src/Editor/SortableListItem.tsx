import React, { ReactElement } from 'react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';
import { LegacyProductCard } from '../ProductCard';
import { useIntegration } from './IntegrationContext';
import ProductCard from '../ProductCard';
import { Product } from '../types';
import { RenderDragFn } from '../ProductCard/types';

export interface Props {
  product: Product;
  disabled: boolean;
  onDelete: () => void;
  isSortable: boolean;
  skuType?: string;
  index: number;
}

const CardDragHandle = SortableHandle(({ drag }: { drag: ReactElement }) => <>{drag}</>);

export const SortableListItem = SortableElement<Props>((props: Props) => {
  const { productCardVersion } = useIntegration();
  const dragHandleRender: RenderDragFn | undefined = props.isSortable
    ? ({ drag }) => <CardDragHandle drag={drag} />
    : undefined;

  if (productCardVersion === 'v2') {
    return (
      <ProductCard
        dragHandleRender={dragHandleRender}
        productCardType={'field'}
        resource={props.product}
        title={props.skuType!}
        cardIndex={props.index}
      />
    );
  }

  return <LegacyProductCard {...props} />;
});
