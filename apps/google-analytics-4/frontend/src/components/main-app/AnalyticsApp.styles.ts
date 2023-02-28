import { css, keyframes } from 'emotion';
import tokens from '@contentful/f36-tokens'
const load = keyframes`
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
`

export const styles = {
    loader: css({
        height: '100%',
        width: '100%',
        ":before": {
            content: "''",
            position: 'absolute',
            top: 0,
            right: 'auto',
            bottom: 0,
            left: 'auto',
            margin: 'auto',
            height: '50px',
            width: '50px',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderTopColor: `${tokens.blue500}`,
            borderRightColor: 'rgba(0, 0, 0, 0.1)',
            borderBottomColor: 'rgba(0, 0, 0, 0.1)',
            borderLeftColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '100%',

            animation: `${load} 1s linear infinite`,
        }
    }),
    wrapper: css({
        height: '100px',
        width: '100px',
        margin: 'auto'
    })
};
