import { CSSProperties } from 'react';
import tokens from '@contentful/f36-tokens';

export const cellWithWidth = (width: string): CSSProperties => ({
  verticalAlign: 'middle',
  width,
  minWidth: tokens.spacing2Xl,
});

export const needsUpdateTableStyles = {
  titleCell: cellWithWidth('30%'),
  creatorCell: cellWithWidth('20%'),
  contentTypeCell: cellWithWidth('20%'),
  publishedDateCell: cellWithWidth('15%'),
  ageCell: cellWithWidth('15%'),
};

export const recentlyPublishedTableStyles = {
  titleCell: cellWithWidth('35%'),
  creatorCell: cellWithWidth('25%'),
  contentTypeCell: cellWithWidth('25%'),
  publishedDateCell: cellWithWidth('15%'),
};

export const scheduledContentTableStyles = {
  titleCell: cellWithWidth('25%'),
  creatorCell: cellWithWidth('15%'),
  contentTypeCell: cellWithWidth('15%'),
  publishedDateCell: cellWithWidth('15%'),
  scheduledDateCell: cellWithWidth('15%'),
  statusCell: cellWithWidth('15%'),
};

export const releasesTableStyles = {
  titleCell: cellWithWidth('25%'),
  dateCell: cellWithWidth('20%'),
  itemsCell: cellWithWidth('10%'),
  updatedCell: cellWithWidth('20%'),
  userCell: cellWithWidth('15%'),
  actionsCell: cellWithWidth('10%'),
};
