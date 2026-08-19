import fs from 'node:fs';
import path from 'node:path';

export type ReactQueryCopy = {
  version: string;
  path: string;
};

export type ReactQueryMajorsResult = {
  ok: boolean;
  majors: string[];
  copies: ReactQueryCopy[];
  message: string;
};

export function analyzeReactQueryMajors(copies: ReactQueryCopy[]): ReactQueryMajorsResult {
  const majors = [
    ...new Set(copies.map((copy) => copy.version.split('.')[0]).filter(Boolean)),
  ].sort();

  if (majors.length <= 1) {
    return {
      ok: true,
      majors,
      copies,
      message:
        majors.length === 0
          ? 'No @tanstack/react-query copies found.'
          : `Single @tanstack/react-query major found: ${majors[0]}.`,
    };
  }

  const listed = copies.map((copy) => `  ${copy.version} @ ${copy.path}`).join('\n');
  return {
    ok: false,
    majors,
    copies,
    message: [
      `Found multiple majors of @tanstack/react-query (${majors.join(', ')}).`,
      'Vite collapses these to a single major at bundle time; the wrong one',
      'breaks embedded entry/asset cards in field-editor-rich-text (sys crash).',
      'Ensure the install tree resolves to one major.',
      listed,
    ].join('\n'),
  };
}

/**
 * Walk node_modules for every physical @tanstack/react-query package.json.
 * Nested installs under field-editor-reference are the interesting case.
 */
export function findReactQueryPackages(nodeModulesRoot: string): ReactQueryCopy[] {
  const hits: ReactQueryCopy[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > 12) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // Skip Vite/Vitest caches and bin stubs
      if (entry.name === '.bin' || entry.name === '.vite' || entry.name === '.cache') continue;

      const full = path.join(dir, entry.name);

      if (entry.name === '@tanstack') {
        const pkgPath = path.join(full, 'react-query', 'package.json');
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { version?: string };
            if (pkg.version) {
              hits.push({ version: pkg.version, path: path.dirname(pkgPath) });
            }
          } catch {
            // ignore unreadable package.json
          }
        }
        continue;
      }

      if (
        entry.name === 'node_modules' ||
        dir.endsWith(`${path.sep}node_modules`) ||
        entry.name.startsWith('@')
      ) {
        walk(full, depth + 1);
        continue;
      }

      const nested = path.join(full, 'node_modules');
      if (fs.existsSync(nested)) {
        walk(nested, depth + 1);
      }
    }
  }

  if (fs.existsSync(nodeModulesRoot)) {
    walk(nodeModulesRoot, 0);
  }

  return hits;
}
