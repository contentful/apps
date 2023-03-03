import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const googleAnalyticsBrand = {
  primaryColor: '#E8710A',
  url: 'https://www.google.com/analytics',
  logoImage: './images/google-analytics-logo.png',
};

const styles = {
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: tokens.contentWidthText,
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
    backgroundColor: googleAnalyticsBrand.primaryColor,
  }),
  icon: css({
    display: 'flex',
    justifyContent: 'center',
    img: {
      display: 'block',
      width: '170px',
      margin: `${tokens.spacingXl} 0`,
    },
  }),
};

export default function GoogleAnalyticsIcon() {
  return (
    <div className={styles.icon}>
      <a href={googleAnalyticsBrand.url} target="_blank" rel="noopener noreferrer">
        <img src={googleAnalyticsBrand.logoImage} alt="Google Analytics" />
      </a>
    </div>
  );
}
