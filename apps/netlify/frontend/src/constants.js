export const EVENT_TRIGGERED = 'triggered';
export const EVENT_TRIGGER_FAILED = 'trigger-failed';

export const CONTENTFUL_EVENTS = [EVENT_TRIGGERED, EVENT_TRIGGER_FAILED];

export const EVENT_BUILD_STARTED = 'build-started';
export const EVENT_BUILD_READY = 'build-ready';
export const EVENT_BUILD_FAILED = 'build-failed';

export const NETLIFY_EVENTS = [EVENT_BUILD_STARTED, EVENT_BUILD_READY, EVENT_BUILD_FAILED];

export const NETLIFY_STATE_TO_EVENT = {
  uploaded: EVENT_BUILD_STARTED,
  building: EVENT_BUILD_STARTED,
  ready: EVENT_BUILD_READY,
  error: EVENT_BUILD_FAILED,
};

export const PUBNUB_PUBLISH_KEY = 'pub-c-51df0950-e61c-4547-a621-b83f4a96652a';
export const PUBNUB_SUBSCRIBE_KEY = 'sub-c-72137dd0-3607-4bf8-b97f-fc223e76ad23';

export const NETLIFY_CLIENT_ID = 'a1d06395eadd312fc45ab6f0f6d7fd6665642c9fcb697839739d157f93bbe918';
export const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';
export const NETLIFY_AUTHORIZE_ENDPOINT = 'https://app.netlify.com/authorize';
export const NETLIFY_AUTH_WINDOW_OPTS = 'left=150,top=150,width=700,height=700';
export const NETLIFY_AUTH_POLL_INTERVAL = 1000;

export const MAX_CONFIGS = 20;
