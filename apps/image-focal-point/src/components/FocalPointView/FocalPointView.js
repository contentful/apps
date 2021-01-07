import React from 'react';
import PropTypes from 'prop-types';
import { Button, TextInput, TextLink } from '@contentful/forma-36-react-components';

import { styles } from './styles';

const FocalPointView = ({ focalPoint, showFocalPointDialog, resetFocalPoint }) => {
  const value = focalPoint ? `x: ${focalPoint.x}px / y: ${focalPoint.y}px` : 'Focal point not set';

  return (
    <div className={styles.container}>
      <TextInput
        className={styles.input}
        width="large"
        type="text"
        id="focal-point"
        testId="focal-point"
        value={value}
        disabled
      />
      <Button className={styles.button} buttonType="muted" onClick={showFocalPointDialog}>
        Set focal point
      </Button>
      <TextLink linkType="primary" onClick={() => resetFocalPoint()}>
        Reset focal point
      </TextLink>
    </div>
  );
};

FocalPointView.propTypes = {
  focalPoint: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }),
  showFocalPointDialog: PropTypes.func.isRequired,
  resetFocalPoint: PropTypes.func.isRequired
};

FocalPointView.defaultProps = {
  focalPoint: {
    x: 0,
    y: 0
  }
};

export { FocalPointView };
