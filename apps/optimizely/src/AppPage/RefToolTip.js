import React from 'react';
import { Tooltip } from '@contentful/f36-components';
import { css } from '@emotion/css';
import { HelpCircleIcon } from '@contentful/f36-icons';

const styles = {
  tooltip: css({
    zIndex: '99999',
  }),
  tooltipContainer: css({
    display: 'inline-block',
    verticalAlign: 'middle',
    marginLeft: '3px',
  }),
};

export default function RefToolTip() {
  return (
    <div className={styles.tooltipContainer}>
      <Tooltip
        className={styles.tooltip}
        content="This field can have a variation container assigned to it by default because it has no explicit validations"
        place="right">
        <HelpCircleIcon variant="secondary" />
      </Tooltip>
    </div>
  );
}
