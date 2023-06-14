import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { AWSAmplifyBrand } from '../common/AmplifyIcon';

export const styles = {
  body: css({
    height: 'auto',
    minHeight: '40vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: '900px',
    backgroundColor: tokens.colorWhite,
    zIndex: 2,
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '2px',
  }),
  background: css({
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    top: 0,
    width: '100%',
    height: '300px',
    backgroundColor: AWSAmplifyBrand.primaryColor,
  }),
  box: {
    width: '100%',
    marginTop: '22px',
  },
  icon: {
    marginTop: '41px',
  },
};
