import { CSSProperties } from 'react';
import tokens from '@contentful/f36-tokens';

export const cellWithWidth = (width: string, style?: CSSProperties): CSSProperties => ({
  verticalAlign: 'middle',
  width,
  minWidth: tokens.spacing2Xl,
  ...style,
});

export const needsUpdateTableStyles = {
  titleCell: cellWithWidth('30%'),
  creatorCell: cellWithWidth('20%'),
  contentTypeCell: cellWithWidth('25%'),
  publishedDateCell: cellWithWidth('15%'),
  ageCell: cellWithWidth('10%'),
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
  contentTypeCell: cellWithWidth('20%'),
  publishedDateCell: cellWithWidth('15%'),
  scheduledDateCell: cellWithWidth('15%'),
  statusCell: cellWithWidth('10%'),
};

export const releasesTableStyles = {
  titleCell: cellWithWidth('25%', { padding: tokens.spacingXs }),
  dateCell: cellWithWidth('20%', { padding: tokens.spacingXs }),
  itemsCell: cellWithWidth('10%', { padding: tokens.spacingXs }),
  updatedCell: cellWithWidth('20%', { padding: tokens.spacingXs }),
  userCell: cellWithWidth('15%', { padding: tokens.spacingXs }),
  actionsCell: cellWithWidth('10%', { padding: tokens.spacingXs }),
};
