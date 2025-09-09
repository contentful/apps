import { css } from 'emotion';
import { SIDEBAR_WIDTH, STICKY_SPACER_SPACING } from '../utils/constants';

export const styles = {
  container: css({
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 1,
    width: 1645,
  }),
};
