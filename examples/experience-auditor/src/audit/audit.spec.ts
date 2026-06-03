import { describe, expect, it } from 'vitest';
import type { ComponentPropertyDescriptor } from '@contentful/app-sdk';
import { computeScore, hasBlockingErrors, runAudit } from './engine';
import { AUDIT_RULES } from './rules';
import type { CollectedNode } from './types';

function node(
  id: string,
  properties: ComponentPropertyDescriptor[]
): CollectedNode {
  return { id, nodeType: 'Component', properties };
}

describe('audit rules', () => {
  it('flags an image with no alt text as an error', () => {
    const report = runAudit([
      node('hero', [
        { key: 'image', area: 'content', value: { sys: { id: 'a1' } } },
        { key: 'altText', area: 'content', value: '' },
      ]),
    ]);

    const finding = report.findings.find((f) => f.ruleId === 'a11y/image-alt-text');
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe('error');
  });

  it('does not flag an image that has alt text', () => {
    const report = runAudit([
      node('hero', [
        { key: 'image', area: 'content', value: { sys: { id: 'a1' } } },
        { key: 'altText', area: 'content', value: 'A hero image' },
      ]),
    ]);

    expect(report.findings.find((f) => f.ruleId === 'a11y/image-alt-text')).toBeUndefined();
  });

  it('offers a trim fix when alt text has surrounding whitespace', () => {
    const report = runAudit([
      node('hero', [
        { key: 'image', area: 'content', value: { sys: { id: 'a1' } } },
        { key: 'altText', area: 'content', value: '  spaced  ' },
      ]),
    ]);

    const finding = report.findings.find((f) => f.ruleId === 'a11y/image-alt-text');
    expect(finding?.severity).toBe('warning');
    expect(finding?.fix).toEqual({
      label: 'Trim whitespace',
      propertyKey: 'altText',
      value: 'spaced',
    });
  });

  it('does not flag a node without an image', () => {
    const report = runAudit([node('text', [{ key: 'body', area: 'content', value: 'Hi' }])]);
    expect(report.findings.filter((f) => f.ruleId === 'a11y/image-alt-text')).toHaveLength(0);
  });

  it('flags an empty heading as a warning', () => {
    const report = runAudit([node('cta', [{ key: 'heading', area: 'content', value: '' }])]);
    const finding = report.findings.find((f) => f.ruleId === 'content/required-empty');
    expect(finding?.severity).toBe('warning');
  });

  it('flags empty SEO metadata as info', () => {
    const report = runAudit([
      node('page', [{ key: 'metaDescription', area: 'content', value: '' }]),
    ]);
    const finding = report.findings.find((f) => f.ruleId === 'seo/missing-meta');
    expect(finding?.severity).toBe('info');
  });

  it('flags a broken entry binding as an error', () => {
    const report = runAudit([
      node('card', [
        {
          key: 'title',
          area: 'content',
          value: null,
          binding: { sourceType: 'entry' },
        },
      ]),
    ]);
    const finding = report.findings.find((f) => f.ruleId === 'content/broken-binding');
    expect(finding?.severity).toBe('error');
  });

  it('does not flag a resolved entry binding', () => {
    const report = runAudit([
      node('card', [
        {
          key: 'title',
          area: 'content',
          value: 'Bound',
          binding: { sourceType: 'entry', entryId: 'entry-1' },
        },
      ]),
    ]);
    expect(report.findings.find((f) => f.ruleId === 'content/broken-binding')).toBeUndefined();
  });

  it('exposes a stable rule set', () => {
    expect(AUDIT_RULES.map((r) => r.id)).toEqual([
      'a11y/image-alt-text',
      'content/required-empty',
      'seo/missing-meta',
      'content/broken-binding',
    ]);
  });
});

describe('scoring', () => {
  it('scores a clean experience at 100', () => {
    const report = runAudit([node('ok', [{ key: 'body', area: 'content', value: 'Hello' }])]);
    expect(report.score).toBe(100);
    expect(hasBlockingErrors(report)).toBe(false);
  });

  it('subtracts weighted penalties and clamps at zero', () => {
    expect(computeScore([])).toBe(100);
    expect(
      computeScore([
        { id: 'a', ruleId: 'r', nodeId: 'n', nodeType: 'Component', severity: 'error', title: '', detail: '' },
        { id: 'b', ruleId: 'r', nodeId: 'n', nodeType: 'Component', severity: 'warning', title: '', detail: '' },
        { id: 'c', ruleId: 'r', nodeId: 'n', nodeType: 'Component', severity: 'info', title: '', detail: '' },
      ])
    ).toBe(85); // 100 - (10 + 4 + 1)
  });

  it('reports blocking errors when any error is present', () => {
    const report = runAudit([
      node('hero', [
        { key: 'image', area: 'content', value: { sys: { id: 'a1' } } },
        { key: 'altText', area: 'content', value: '' },
      ]),
    ]);
    expect(hasBlockingErrors(report)).toBe(true);
  });

  it('sorts findings errors-first', () => {
    const report = runAudit([
      node('a', [{ key: 'metaTitle', area: 'content', value: '' }]), // info
      node('b', [
        { key: 'image', area: 'content', value: { sys: { id: 'x' } } },
        { key: 'altText', area: 'content', value: '' }, // error
      ]),
    ]);
    expect(report.findings[0].severity).toBe('error');
  });
});
