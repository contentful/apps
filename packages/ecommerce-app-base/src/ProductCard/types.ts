import type { ReactElement } from 'react';
import { Product } from '../types';

export type ExternalResource = Product;

// the variant states of ProductCard, for now, labeled by location
export type ProductCardType = 'field' | 'dialog';

export type ExternalResourceError = {
  error: string;
  errorMessage: string;
  errorStatus: number;
};

// This should be pulled from our own package
export type RenderDragFn = (props: { drag: ReactElement; isDragging?: boolean }) => ReactElement;
