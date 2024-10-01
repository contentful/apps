import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

import { Paragraph } from '@contentful/f36-components';

import ConnectButton from '../ConnectButton';

const styles = {
  spacing: css({
    margin: `${tokens.spacingM} 0`,
  }),
};

export default function Connect({ openAuth }) {
  return (
    <>
      <Paragraph className={styles.spacing}>
        In order to see your experiments and connect them to Contentful content, we will need you to
        connect your Optimizely account by clicking on the button below. It will ask you to grant
        Contentful permissions to access your Optimizely experiments.
      </Paragraph>
      <ConnectButton openAuth={openAuth} />
    </>
  );
}

Connect.propTypes = {
  openAuth: PropTypes.func.isRequired,
};
