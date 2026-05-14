import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  root: css({
    marginTop: tokens.spacing2Xs,
    width: '168px',
  }),
  controls: css({
    alignItems: 'flex-end',
    flexShrink: 0,
    minHeight: '96px',
    justifyContent: 'space-between',
  }),
  customRangeRow: css({
    marginTop: tokens.spacing2Xs,
    gap: tokens.spacing2Xs,
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '168px',
  }),
  customRangeRowVisible: css({
    visibility: 'visible',
  }),
  customRangeRowHidden: css({
    visibility: 'hidden',
    pointerEvents: 'none',
  }),
  customRangeButton: css({
    width: '168px',
  }),
};
