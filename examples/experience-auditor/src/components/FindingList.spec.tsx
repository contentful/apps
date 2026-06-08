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

describe('FindingList suggested-fix seeding', () => {
  it('re-seeds the suggested value when the suggestion changes for the same finding id', () => {
    const props = {
      canLocate: false,
      canFix: true,
      onLocate: vi.fn(),
      onApplyDeterministic: vi.fn(),
      onApplySuggested: vi.fn(),
      busyFindingId: null,
    };
    const { getByLabelText, rerender } = render(
      <FindingList findings={[suggestedFinding('Spring Sale')]} {...props} />
    );
    expect((getByLabelText('Suggested value') as HTMLInputElement).value).toBe('Spring Sale');

    // Same finding.id, new derived suggestion (heading changed, meta still empty).
    rerender(<FindingList findings={[suggestedFinding('Spring Sale 2026')]} {...props} />);
    expect((getByLabelText('Suggested value') as HTMLInputElement).value).toBe('Spring Sale 2026');
  });
});
