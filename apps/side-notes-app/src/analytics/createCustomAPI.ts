import { createAnalyticsAPI } from './createAnalyticsAPI';
import type { Channel, Channels, CustomAPI } from '../types';

export const createCustomAPI = (channel: Channel<Channels>): CustomAPI => {
  return {
    analytics: createAnalyticsAPI(channel),
  };
};
