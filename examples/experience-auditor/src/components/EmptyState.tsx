import React from 'react';
import { Note } from '@contentful/f36-components';

/** Celebration state shown when the experience passes every audit rule. */
const EmptyState = () => (
  <Note variant="positive" data-test-id="all-clear">
    🎉 No issues found. This experience passes every audit rule.
  </Note>
);

export default EmptyState;
