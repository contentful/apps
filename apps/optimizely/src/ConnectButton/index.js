import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import OptimizelyLogo from './OptimizelyLogo';

import { Button } from '@contentful/f36-components';

const styles = {
  connect: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: 'transparent!important', // necessary to eliminate the forma styling in favor of the custom optimizely styling
    },
  }),
};

export default function ConnectButton({ openAuth }) {
  return (
    <Button
      className={styles.connect}
      onClick={openAuth}
      testId="connect-button"
      isFullWidth
      variant="transparent"
    >
      <OptimizelyLogo />
    </Button>
  );
}

ConnectButton.propTypes = {
  openAuth: PropTypes.func.isRequired,
};
