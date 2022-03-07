import { configToParameters, parametersToConfig } from '../src/config';

const config = {
  netlifyHookIds: ['hook1', 'hook2'],
  sites: [
    {
      buildHookId: 'bh1',
      name: 'Site 1',
      netlifySiteId: 'id1',
      netlifySiteName: 'foo-bar',
      netlifySiteUrl: 'https://foo-bar.netlify.com',
      selectedContentTypes: [],
    },
    {
      buildHookId: 'bh2',
      name: 'Site 2',
      netlifySiteId: 'id2',
      netlifySiteName: 'bar-baz',
      netlifySiteUrl: 'https://bar-baz.netlify.com',
      selectedContentTypes: ['type1', 'type2'],
    },
    {
      buildHookId: 'bh3',
      name: 'Site 3',
      netlifySiteId: 'id3',
      netlifySiteName: 'foo-bar-baz',
      netlifySiteUrl: 'https://foo-bar-baz.netlify.com',
      selectedContentTypes: '*',
    },
  ],
};

const parameters = {
  notificationHookIds: 'hook1,hook2',
  buildHookIds: 'bh1,bh2,bh3',
  names: 'Site 1,Site 2,Site 3',
  siteIds: 'id1,id2,id3',
  siteNames: 'foo-bar,bar-baz,foo-bar-baz',
  siteUrls: 'https://foo-bar.netlify.com,https://bar-baz.netlify.com,https://foo-bar-baz.netlify.com',
  events: {
    'bh2': 'type1,type2',
    'bh3': '*',
  },
};

describe('config', () => {
  describe('configToParameters', () => {
    it('translates internal config format to extension parameters', () => {
      expect(configToParameters(config)).toEqual(parameters);
    });
  });

  describe('parametersToConfig', () => {
    it('translates extension parameters to internal config format', () => {
      expect(parametersToConfig(parameters)).toEqual(config);
    });

    it('trims whitespace, ignores empty', () => {
      expect(
        parametersToConfig({
          ...parameters,
          names: '    Site 1   ,,   Site 2,,,, Site 3',
        })
      ).toEqual(config);
    });
  });
});
