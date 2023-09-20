import { css } from 'emotion';

export const styles = {
  wrapper: css({
    'p:last-child': {
      marginTop: 0,
    },
  }),
  button: css({
    marginRight: 10,
  }),
  box: css({
    display: 'inline-block',
    boxShadow: '0 10px 10px rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
  }),
};
