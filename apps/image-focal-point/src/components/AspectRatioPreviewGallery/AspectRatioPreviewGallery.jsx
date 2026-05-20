import React from 'react';
import PropTypes from 'prop-types';
import { Subheading } from '@contentful/f36-components';

import { ImagePreviewWithFocalPoint } from '../ImagePreviewWithFocalPoint';
import { styles } from './styles';

const PREVIEW_RATIOS = [
  { label: '16:9', width: 160, height: 90 },
  { label: '4:3', width: 144, height: 108 },
  { label: '1:1', width: 108, height: 108 },
];

export const AspectRatioPreviewGallery = ({
  className = '',
  file,
  focalPoint,
  title = 'Aspect ratio previews',
}) => {
  if (!file || !focalPoint) {
    return null;
  }

  return (
    <section className={`${styles.container} ${className}`.trim()} aria-label={title}>
      {title && <Subheading className={styles.heading}>{title}</Subheading>}
      <div className={styles.gallery}>
        {PREVIEW_RATIOS.map(({ label, width, height }) => (
          <ImagePreviewWithFocalPoint
            key={label}
            className={styles.preview}
            file={file}
            focalPoint={focalPoint}
            wrapperWidth={width}
            wrapperHeight={height}
            subtitle={label}
          />
        ))}
      </div>
    </section>
  );
};

AspectRatioPreviewGallery.propTypes = {
  className: PropTypes.string,
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
  title: PropTypes.string,
};
