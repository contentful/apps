import { css } from '@emotion/react';

export const styles = {
  note: css(`
    button {
      padding-top: 0
    }
    overflow: 'hidden',
    wordBreak: 'break-word',
    width: '100%',
  `),
  noteContent: css({
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  }),
};
