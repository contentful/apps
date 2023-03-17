import { css, keyframes } from 'emotion';
import tokens from '@contentful/f36-tokens';
const load = keyframes`
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
`;

const loaderWidth = 50;
export const styles = {
  loader: css({
    height: '100%',
    width: '100%',
    ':before': {
      content: "''",
      position: 'absolute',
      top: `calc(50% - ${loaderWidth / 2}px)`,
      left: `calc(50% - ${loaderWidth / 2}px)`,
      margin: 'auto',
      height: `${loaderWidth}px`,
      width: `${loaderWidth}px`,
      borderWidth: `${loaderWidth / 10}px`,
      borderStyle: 'solid',
      borderTopColor: `${tokens.blue500}`,
      borderRightColor: 'rgba(0, 0, 0, 0.1)',
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      borderLeftColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '100%',
      animation: `${load} 1s linear infinite`,
    },
  }),
  wrapper: css({
    height: '100px',
    width: '100px',
    margin: 'auto',
  }),
  note: css({
    overflow: 'hidden',
    marginBottom: tokens.spacingM,
  }),
  noteContent: css({
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
  }),
};
