import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeReactQueryMajors, findReactQueryPackages } from './reactQueryMajors';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('analyzeReactQueryMajors', () => {
  it('passes when there are no copies (package not in tree)', () => {
    const result = analyzeReactQueryMajors([]);
    expect(result.ok).toBe(true);
    expect(result.majors).toEqual([]);
  });

  it('passes when every copy shares one major', () => {
    const result = analyzeReactQueryMajors([
      { version: '4.44.0', path: '/a/node_modules/@tanstack/react-query' },
      { version: '4.36.1', path: '/a/node_modules/nested/@tanstack/react-query' },
    ]);
    expect(result.ok).toBe(true);
    expect(result.majors).toEqual(['4']);
  });

  it('fails when majors 4 and 5 both appear (RTV crash-class tree)', () => {
    const result = analyzeReactQueryMajors([
      { version: '5.101.2', path: '/a/node_modules/@tanstack/react-query' },
      {
        version: '4.44.0',
        path: '/a/node_modules/@contentful/field-editor-reference/node_modules/@tanstack/react-query',
      },
    ]);
    expect(result.ok).toBe(false);
    expect(result.majors).toEqual(['4', '5']);
    expect(result.message).toMatch(/multiple majors/i);
  });
});

describe('findReactQueryPackages (install tree)', () => {
  it('finds only one major under this app node_modules', () => {
    const copies = findReactQueryPackages(path.join(appRoot, 'node_modules'));
    const result = analyzeReactQueryMajors(copies);

    expect(copies.length).toBeGreaterThan(0);
    expect(result.ok, result.message).toBe(true);
    expect(result.majors).toHaveLength(1);
  });
});
