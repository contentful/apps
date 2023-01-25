import { IdsAPI } from '@contentful/app-sdk';
import { byChannelName, getEnvironmentName } from './utils';
import { SlackChannelSimplified } from './workspace.store';

describe('utils', () => {
  describe('getEnvironmentIds', () => {
    describe('when environment is aliased', () => {
      let idsAPI: Pick<IdsAPI, 'environmentAlias' | 'environment'>;
      beforeEach(() => {
        idsAPI = {
          environmentAlias: 'alias',
          environment: 'environment',
        };
      });

      it('returns alias name', () => {
        expect(getEnvironmentName(idsAPI)).toBe(idsAPI.environmentAlias);
      });
    });

    describe('when environment is not aliased', () => {
      let idsAPI: Pick<IdsAPI, 'environmentAlias' | 'environment'>;
      beforeEach(() => {
        idsAPI = {
          environmentAlias: undefined,
          environment: 'environment',
        } as unknown as IdsAPI;
      });

      it('returns environment display name', () => {
        expect(getEnvironmentName(idsAPI)).toBe(idsAPI.environment);
      });
    });
  });

  describe('byChannelName', () => {
    it('sorts channels correctly', () => {
      const a = { name: 'z' } as SlackChannelSimplified;
      const b = { name: 'b' } as SlackChannelSimplified;

      expect([a, b].sort(byChannelName)).toEqual([b, a]);
    });

    it('leaves lists untouched', () => {
      const a = { name: 'a' } as SlackChannelSimplified;
      const b = { name: 'b' } as SlackChannelSimplified;

      expect([a, b].sort(byChannelName)).toEqual([a, b]);
    });
  });
});
