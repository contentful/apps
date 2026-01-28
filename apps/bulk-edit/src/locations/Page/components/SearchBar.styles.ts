import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  container: css({
    width: '97%',
  }),
  fieldFilterListContainer: css({
    display: 'flex',
    flexDirection: 'row',
    gap: `${tokens.spacingXs}`,
    flexWrap: 'wrap',
  }),
};
