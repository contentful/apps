import React from 'react';
import { Note } from '@contentful/f36-components';

/** Celebration or empty-tree state depending on whether nodes were collected. */
const EmptyState = ({ nodeCount }: { nodeCount: number }) => {
  if (nodeCount === 0) {
    return (
      <Note variant="neutral" data-test-id="no-tree-data">
        No components to audit yet. The experience tree may not be synced by the host — try demo
        mode (<code>/?demo</code>) to exercise the full audit loop locally.
      </Note>
    );
  }

  return (
    <Note variant="positive" data-test-id="all-clear">
      🎉 No issues found. This experience passes every audit rule.
    </Note>
  );
};

export default EmptyState;
