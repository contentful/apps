import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import { Product } from '../../interfaces';

const IMAGE_SIZE = 48;

export const styles = {
  card: css({
    display: 'flex',
    padding: 0,
    position: 'relative',
    ':not(:first-of-type)': css({
      marginTop: tokens.spacingXs,
    }),
  }),
  imageWrapper: (imageHasLoaded: boolean) =>
    css({
      width: imageHasLoaded ? `${IMAGE_SIZE}px` : 0,
      height: imageHasLoaded ? `${IMAGE_SIZE}px` : 0,
      overflow: 'hidden',
      margin: imageHasLoaded ? tokens.spacingM : 0,
      position: 'relative',
      '> img': css({
        display: 'block',
        height: `${IMAGE_SIZE}px`,
        minWidth: 'auto',
        userSelect: 'none',
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }),
    }),
  dragHandle: css({
    height: 'auto',
  }),
  actions: css({
    position: 'absolute',
    top: tokens.spacingXs,
    right: tokens.spacingXs,
    a: css({
      display: 'inline-block',
      marginRight: tokens.spacingXs,
      svg: css({
        transition: `fill ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
      }),
      '&:hover': {
        svg: css({
          fill: tokens.colorBlack,
        }),
      },
    }),
  }),
  description: css({
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  }),
  heading: (product: Product) =>
    css({
      fontSize: tokens.fontSizeL,
      marginBottom: product.isMissing || !product.name ? 0 : tokens.spacing2Xs,
      ...(product.name && { textTransform: 'capitalize' }),
    }),
  subheading: css({
    color: tokens.gray500,
    fontSize: tokens.fontSizeS,
    marginBottom: 0,
  }),
  skeletonImage: css({
    width: `${IMAGE_SIZE}px`,
    height: `${IMAGE_SIZE}px`,
    padding: tokens.spacingM,
  }),
  errorImage: css({
    backgroundColor: tokens.gray100,
    borderRadius: '3px',
    margin: tokens.spacingM,
    width: `${IMAGE_SIZE}px`,
    height: `${IMAGE_SIZE}px`,
    position: 'relative',
    svg: css({
      fill: tokens.gray600,
      width: '100%',
      height: '50%',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }),
  }),
};
