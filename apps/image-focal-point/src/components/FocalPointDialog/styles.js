import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const MAX_PREVIEW_WRAPPER_SIZE = 350;

export const styles = {
  modalContent: css({
    display: 'flex',
  }),
  previewWrapper: css({
    backgroundColor: tokens.gray200,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    width: `${MAX_PREVIEW_WRAPPER_SIZE}px`,
    height: `${MAX_PREVIEW_WRAPPER_SIZE}px`,
  }),
  previewImg: css({
    '&, & > img': {
      cursor: 'crosshair',
      display: 'block',
      margin: '0 auto',
      maxWidth: '100%',
      maxHeight: '100%',
      outline: 0,
    },
    '& > img[src$=".svg"]': {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
  }),
  focalPointDemo: css({
    display: 'flex',
    flexDirection: 'column',
    marginLeft: tokens.spacing2Xl,
  }),
  displayFlex: css({
    display: 'flex',
  }),
  spacingLeftXs: css({
    marginLeft: tokens.spacingXs,
  }),
  previewHeading: css({
    marginTop: tokens.spacingM,
  }),
  subheading: css({
    marginBottom: tokens.spacingXs,
  }),
};
