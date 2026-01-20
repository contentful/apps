import { css } from 'emotion';

export const styles = {
  chatLayoutWrapper: css({
    position: 'fixed',
    zIndex: 1000,
  }),
  chatLayout: css({
    '& [data-test-id="cf-collapse"]': {
      width: '100%',
    },
  }),
  chatHistory: css({
    li: {
      marginBottom: '0',
    },
  }),
  messageList: css({
    overflowY: 'auto',
  }),
  slider: css({
    height: '100vh',
  }),
  gradientIcon: css({
    display: 'inline-flex',
    '& svg': {
      fill: 'url(#ai-agent-gradient)',
    },
  }),
  hiddenSvg: css({
    position: 'absolute',
    width: 0,
    height: 0,
    visibility: 'hidden',
  }),
};
