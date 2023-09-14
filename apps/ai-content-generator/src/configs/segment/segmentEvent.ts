export enum SegmentAction {
  CONFIG_SAVED = 'config_saved',
  SIDEBAR_RENDERED = 'sidebar_rendered',
  DIALOG_OPENED = 'dialog_opened',
  DIALOG_CLOSED_BY_USER = 'dialog_closed_by_user',
  SOURCE_EDITED = 'source_edited',
  PROMPT_EDITED = 'prompt_edited',
  REWRITE_SELECTED = 'rewrite_selected',
  CONTENT_EDITED = 'content_edited',
  CONTENT_GENERATED = 'content_generated',
  CONTENT_REGENERATED = 'content_regenerated',
  CONTENT_APPLIED = 'content_applied',
  CONTENT_COPIED = 'content_copied',
  ERROR_API_KEY = 'error_api_key',
  ERROR_STREAM = 'error_stream',
  ERROR_APPLY = 'error_apply',
  ERROR_GENERIC = 'error_generic',
}

export interface SegmentEventData {
  action_performed_at_ms?: string;
  feature_id?: string;
  from_prompt?: boolean;
  sourceLocale?: string;
  targetLocale?: string;
}

export interface SegmentAppData {
  profile: boolean;
  values: boolean;
  tone: boolean;
  exclude: boolean;
  include: boolean;
  audience: boolean;
  additional: boolean;
}

export interface SegmentEvent extends SegmentEventData {
  action: SegmentAction;
  gptModel: string;
  configOptions?: SegmentAppData;
}

export interface SegmentIdentify {
  environment_key: string;
  organization_key: string;
  space_key: string;
}
