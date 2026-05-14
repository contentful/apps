import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

const mappingGroupSurfaceBase = css({
  borderRadius: tokens.borderRadiusMedium,
  padding: tokens.spacing2Xs,
});

export const mappingGroupSurfaceView = css([
  mappingGroupSurfaceBase,
  {
    border: `1px solid ${tokens.green500}`,
    transition: 'border-color 120ms ease, border-width 120ms ease',
  },
]);

export const mappingGroupSurfaceViewHovered = css([
  mappingGroupSurfaceBase,
  {
    border: `2px solid ${tokens.green600}`,
    transition: 'border-color 120ms ease, border-width 120ms ease',
  },
]);

export const mappingGroupSurfaceEdit = css([
  mappingGroupSurfaceBase,
  {
    backgroundColor: tokens.green100,
  },
]);
