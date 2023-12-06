export type WidgetRenderLocation = 'Field' | 'Sidebar';

export enum WidgetType {
  Paragraph = 'Paragraph',
  Headline = 'Headline',
  ActionTrigger = 'ActionTrigger',
  NativeFieldEditor = 'NativeFieldEditor',
  Link = 'Link',
  Note = 'Note',
}

export interface WidgetElementDefinition {
  key: string;
  type: WidgetType;
  props: WidgetTemplateProps[];
  content: string;
}

export enum PropType {
  DROPDOWN = 'dropdown',
  ACTION_SELECT = 'action_select',
  URL = 'url',
  TEXT = 'text',
  TEXTAREA = 'textarea',
}

export type WidgetTemplateProps =
  | { key: string; type: PropType.TEXT; label: string; value: string }
  | {
      key: string;
      type: PropType.DROPDOWN;
      label: string;
      options: { key: string; title: string }[];
      value: string;
    }
  | {
      key: string;
      type: PropType.URL;
      label: string;
      value: string;
    }
  | {
      key: string;
      type: PropType.TEXTAREA;
      label: string;
      value: string;
    }
  | {
      key: string;
      type: PropType.ACTION_SELECT;
      label: string;
      options?: { key: string; title: string }[];
      value?: string;
      // stringified value
      parameters: string;
    };

export interface PropConfig {
  type: PropType;
}

export interface WidgetTemplate {
  /**
   * Human readable name
   */
  name: string;

  type: WidgetType;
  props: WidgetTemplateProps[];
  content: string;
}
