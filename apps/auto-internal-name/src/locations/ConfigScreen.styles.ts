import { css } from 'emotion';

export const styles = {
  container: css({
    width: '50%',
    margin: '0 auto',
  }),
  formControl: css({
    flex: 1,
  }),
  autocomplete: css({
    '& button': {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
    },
  }),
};
