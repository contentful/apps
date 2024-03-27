import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { VercelBrand } from '../common/VercelIcon';

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
    backgroundColor: VercelBrand.primaryColor,
  }),
  box: css({
    width: '100%',
  }),
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),
  badgeContainer: css({
    marginTop: '10px',
    width: '100%',
  }),
  icon: css({
    marginTop: '41px',
  }),
  heading: css({
    fontSize: '1rem',
  }),
};
