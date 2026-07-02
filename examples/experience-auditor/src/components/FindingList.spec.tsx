import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FindingList from './FindingList';
import type { AuditFinding } from '../audit/types';

function suggestedFinding(suggestedValue: string): AuditFinding {
  return {
    id: 'seo/missing-meta:page:metaTitle', // stable across re-audits
    ruleId: 'seo/missing-meta',
    nodeId: 'page',
    nodeType: 'Component',
    propertyKey: 'metaTitle',
    severity: 'info',
    title: 'SEO metadata is empty',
    detail: 'metaTitle is empty.',
    fix: {
      kind: 'suggested',
      label: 'Use heading as meta',
      propertyKey: 'metaTitle',
      suggestedValue,
      source: 'the heading on this component',
    },
  };
}

describe('FindingList suggested-fix display', () => {
  it('renders the derived suggestion as read-only advice', () => {
    const props = {
      canLocate: false,
      onLocate: vi.fn(),
    };
    const { getByTestId, rerender } = render(
      <FindingList findings={[suggestedFinding('Spring Sale')]} {...props} />
    );
    expect(getByTestId('suggested-value')).toHaveTextContent('Spring Sale');

    // A re-derived suggestion (heading changed, meta still empty) updates the
    // displayed value.
    rerender(<FindingList findings={[suggestedFinding('Spring Sale 2026')]} {...props} />);
    expect(getByTestId('suggested-value')).toHaveTextContent('Spring Sale 2026');
  });
});
