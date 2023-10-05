export enum SegmentAction {
  COPIED = 'copied',
  APPLIED = 'applied',
  CANCELED = 'canceled',
}

export enum SegmentEvents {
  CONFIG_SAVED = 'ai_content_generator_config_saved',
  SIDEBAR_RENDERED = 'ai_content_generator_sidebar_rendered',
  FLOW_START = 'ai_content_generator_flow_start',
  FLOW_END = 'ai_content_generator_flow_end',
  GENERATED_CONTENT_EDITED = 'ai_content_generator_generated_content_edited',
  GENERATE_CLICKED = 'ai_content_generator_generate_clicked',
  REGENERATION_CLICKED = 'ai_content_generator_regeneration_clicked',
}

export interface SegmentEventData {
  action?: SegmentAction;
  feature_id?: string;
  from_prompt?: boolean;
  content_generation_prompt?: string;
  source_field?: string;
  target_locale?: string;
  rewrite_prompt?: string;
}

export interface SegmentAppData {
  gpt_model: string;

  config_options: {
    has_profile: boolean;
    has_values: boolean;
    has_tone: boolean;
    has_exclude: boolean;
    has_include: boolean;
    has_audience: boolean;
    has_additional: boolean;
  };
}

export interface SegmentEvent extends SegmentEventData {
  configOptions?: SegmentAppData;
}

export interface SegmentIdentify {
  environment_key: string;
  organization_key: string;
  space_key: string;
}
