import { IdsAPI } from '@contentful/app-sdk';
import { SlackChannelSimplified } from './workspace.store';

export const getEnvironmentName = (ids: Pick<IdsAPI, 'environmentAlias' | 'environment'>) => {
  return ids.environmentAlias ?? ids.environment;
};

export const byChannelName = (a: SlackChannelSimplified, b: SlackChannelSimplified) =>
  a.name < b.name ? -1 : 1;
