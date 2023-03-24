import { css } from 'emotion';

export const styles = {
  note: css({
    overflow: 'hidden',
    wordBreak: 'break-word',
  }),
  noteContent: css({
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 6,
    WebkitBoxOrient: 'vertical',
  }),
};
