import React from 'react';
import PropTypes from 'prop-types';
import { Button, TextInput, TextLink } from '@contentful/f36-components';

import { AspectRatioPreviewGallery } from '../AspectRatioPreviewGallery';
import { styles } from './styles';

const DEFAULT_FOCAL_POINT = { x: 0, y: 0 };

const FocalPointView = ({
  file,
  focalPoint: selectedFocalPoint,
  showFocalPointDialog,
  resetFocalPoint,
}) => {
  const focalPoint = selectedFocalPoint === undefined ? DEFAULT_FOCAL_POINT : selectedFocalPoint;
  const value = focalPoint ? `x: ${focalPoint.x}px / y: ${focalPoint.y}px` : 'Focal point not set';
  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <TextInput
          className={styles.input}
          width="large"
          type="text"
          id="focal-point"
          testId="focal-point"
          value={value}
          isInvalid={!focalPoint}
          isDisabled
        />
        <Button className={styles.button} variant="secondary" onClick={showFocalPointDialog}>
          Set focal point
        </Button>
        <TextLink as="button" variant="primary" onClick={() => resetFocalPoint()}>
          Reset focal point
        </TextLink>
      </div>
      <AspectRatioPreviewGallery file={file} focalPoint={selectedFocalPoint} />
    </div>
  );
};

FocalPointView.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string.isRequired,
    fileName: PropTypes.string.isRequired,
    details: PropTypes.shape({
      image: PropTypes.shape({
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
  }),
  focalPoint: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  showFocalPointDialog: PropTypes.func.isRequired,
  resetFocalPoint: PropTypes.func.isRequired,
};

export { FocalPointView };
