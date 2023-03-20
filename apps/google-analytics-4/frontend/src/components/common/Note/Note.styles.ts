import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  note: css({
    overflow: 'hidden',
    marginBottom: tokens.spacingM,
  }),
  noteContent: css({
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
  }),
};
