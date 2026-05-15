import { css } from '@emotion/css';

// Forces the Text wrapper inside MultiselectOption to stretch full width
// so marginLeft:auto on the Badge pushes it to the trailing edge.
export const optionRow = css({
  '& [data-test-id^="cf-multiselect-list-item"]': {
    width: '100%',
  },
});
