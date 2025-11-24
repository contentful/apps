import tokens from '@contentful/f36-tokens';

export const styles = {
  home: {
    backgroundColor: 'white',
    minHeight: '100vh',
    borderRadius: tokens.borderRadiusMedium,

    boxShadow: `0 4px 20px -4px ${tokens.gray300}`,
  },
  splitter: {
    backgroundColor: tokens.gray200,
  },
  card: {
    maxWidth: 652,
    width: '100%',
    padding: tokens.spacingXl,
  },
  skeletonContainer: {
    maxWidth: '100px',
  },
  skeletonSelectButton: {
    width: '150px',
  },
  skeletonEditButton: {
    width: '80px',
  },
};
