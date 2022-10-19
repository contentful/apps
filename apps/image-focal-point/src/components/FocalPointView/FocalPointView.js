import React from 'react';
import PropTypes from 'prop-types';

import { styles } from './styles';

import { Button, TextInput, TextLink } from '@contentful/f36-components';

const FocalPointView = ({ focalPoint, showFocalPointDialog, resetFocalPoint }) => {
  const value = focalPoint ? `x: ${focalPoint.x}px / y: ${focalPoint.y}px` : 'Focal point not set';

  return (
    <div className={styles.container}>
      <TextInput
        className={styles.input}
        type="text"
        id="focal-point"
        testId="focal-point"
        defaultValue={value}
        isDisabled
      />
      <Button className={styles.button} variant="secondary" onClick={showFocalPointDialog}>
        Set focal point
      </Button>
      <TextLink as="button" variant="primary" onClick={() => resetFocalPoint()}>
        Reset focal point
      </TextLink>
    </div>
  );
};

FocalPointView.propTypes = {
  focalPoint: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  showFocalPointDialog: PropTypes.func.isRequired,
  resetFocalPoint: PropTypes.func.isRequired,
};

FocalPointView.defaultProps = {
  focalPoint: {
    x: 0,
    y: 0,
  },
};

export { FocalPointView };
