import React from 'react';
import { SortableElement } from 'react-sortable-hoc';
import { ListItem, Props } from './ListItem';

export const SortableListItem = SortableElement<Props>((props: Props) => {
  return <ListItem {...props} />;
});
