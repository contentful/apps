import type { ExperienceEditorToolbarAppSDK } from '@contentful/app-sdk';

/**
 * DEMO ONLY — scaffolding for the standalone `?demo` mode. Typed loosely on
 * purpose: the mock only implements the surfaces the toolbar and collector
 * actually touch, and a single `as unknown as ExperienceEditorToolbarAppSDK`
 * cast at the export bridges it to the real SDK type. Not used on any real path.
 */

interface DemoProperty {
  key: string;
  area: 'content';
  value: unknown;
}

function makeNode(id: string, initialProps: DemoProperty[]) {
  return {
    id,
    nodeType: 'Component' as const,
    get: () => ({ id, nodeType: 'Component' as const }),
    onChange: () => () => {},
    getProperties: async () => initialProps,
  };
}

// Three seeded nodes, each planting exactly one finding:
//  - `hero`: image present + empty altText        -> error  (missing alt text)
//  - `cta`:  empty heading                         -> warning (empty heading)
//  - `page`: heading present + empty metaTitle     -> info + suggested fix
const nodes = [
  makeNode('hero', [
    { key: 'image', area: 'content', value: { sys: { id: 'asset-1' } } },
    { key: 'altText', area: 'content', value: '' },
    { key: 'heading', area: 'content', value: 'Welcome' },
  ]),
  makeNode('cta', [{ key: 'heading', area: 'content', value: '' }]),
  makeNode('page', [
    { key: 'heading', area: 'content', value: 'Our Spring Sale' },
    { key: 'metaTitle', area: 'content', value: '' },
  ]),
];

/**
 * DEMO ONLY — a minimal seeded `sdk.experiences`. `experience.selection` is deliberately
 * omitted so the demo exercises the graceful "Locate not available" degradation
 * (`detectCapabilities` reports `selection: false` and the button renders
 * disabled).
 */
export const demoSdk = {
  location: { is: () => true },
  ids: { app: 'demo-app' },
  access: { can: async () => true },
  notifier: {
    success: (m: string) => console.info('[demo notifier]', m),
    error: (m: string) => console.warn('[demo notifier]', m),
    warning: (m: string) => console.warn('[demo notifier]', m),
  },
  experiences: {
    context: { type: 'experience' as const, entityId: 'demo-experience' },
    onContextChanged: () => () => {},
    getUiMode: () => 'visual' as const,
    onUiModeChanged: () => () => {},
    experience: {
      get: () => ({ sys: { id: 'demo-experience' } }),
      onChange: () => () => {},
      save: async () => {},
      publish: async () => {},
      getNode: (id: string) => nodes.find((n) => n.id === id) ?? null,
      getRootNodes: () => nodes,
      // selection intentionally omitted (see above)
    },
  },
} as unknown as ExperienceEditorToolbarAppSDK;
