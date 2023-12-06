import {
  WidgetType,
  PropType,
  WidgetTemplate,
  WidgetTemplateProps,
  WidgetRenderLocation,
} from '../../types/types';

// The Field Editors are not fully functional for these field types
// therefore we can't render the widgets for these fields
export const DISABLED_FIELD_TYPES = ['RichText', 'Location'];

export const WidgetPropsOptions = {
  COLOR: {
    key: 'fontColor',
    type: PropType.DROPDOWN,
    label: 'Color',
    options: [
      { key: 'red900', title: 'Red' },
      { key: 'colorBlack', title: 'Black' },
      { key: 'green900', title: 'Green' },
      { key: 'blue900', title: 'Blue' },
    ],
    value: 'colorBlack',
  },
  LINK: {
    key: 'href',
    type: PropType.URL,
    label: 'Link',
    value: 'http://example.com',
  },
  APP_ACTION_TRIGGER: {
    key: 'actionId',
    type: PropType.ACTION_SELECT,
    label: 'App Action',
    value: '',
    parameters: '{}',
  },
  ACTION_BODY: {
    key: 'actionBody',
    type: PropType.TEXTAREA,
    label: 'App Action Body',
    value: '{}',
  },
  ICON: {
    key: 'icon',
    type: PropType.DROPDOWN,
    label: 'Icon',
    options: [
      { key: 'PlusIcon', title: 'PlusIcon' },
      { key: 'ArrowForwardIcon', title: 'ArrowForwardIcon' },
      { key: 'EditIcon', title: 'EditIcon' },
      { key: 'ExternalLinkIcon', title: 'ExternalLinkIcon' },
    ],
    value: 'primary',
  },
  VARIANT: {
    key: 'variant',
    type: PropType.DROPDOWN,
    label: 'Variant',
    options: [
      { key: 'primary', title: 'Primary' },
      { key: 'secondary', title: 'Secondary' },
      { key: 'positive', title: 'Positive' },
      { key: 'negative', title: 'Negative' },
    ],
    value: 'primary',
  },
  TITLE: {
    key: 'title',
    type: PropType.TEXT,
    label: 'Title',
    value: 'This is a title',
  },
} satisfies Record<string, WidgetTemplateProps>;

export const POSSIBLE_BASE_WIDGETS: WidgetTemplate[] = [
  {
    name: 'Paragraph',
    type: WidgetType.Paragraph,
    content: 'This is a paragraph',
    props: [WidgetPropsOptions.COLOR],
  },
  {
    name: 'Headline',
    type: WidgetType.Headline,
    content: 'This is a headline',
    props: [WidgetPropsOptions.COLOR],
  },
  {
    name: 'Link',
    type: WidgetType.Link,
    content: 'This is a link',
    props: [WidgetPropsOptions.COLOR, WidgetPropsOptions.LINK, WidgetPropsOptions.VARIANT],
  },
  {
    name: 'Note',
    type: WidgetType.Note,
    content: 'This is a note',
    props: [
      WidgetPropsOptions.TITLE,
      {
        key: 'variant',
        type: PropType.DROPDOWN,
        label: 'Variant',
        options: [
          { key: 'primary', title: 'Primary' },
          { key: 'neutral', title: 'Neutral' },
          { key: 'positive', title: 'Positive' },
          { key: 'warning', title: 'Warning' },
          { key: 'negative', title: 'Negative' },
        ],
        value: 'primary',
      },
    ],
  },
  // TODO: actions can not be called from the frontend
  // {
  //   name: "Action trigger",
  //   type: WidgetType.ActionTrigger,
  //   content: "Trigger",
  //   props: [WidgetPropsOptions.VARIANT, WidgetPropsOptions.APP_ACTION_TRIGGER],
  // },
];

export const NATIVE_FIELD_EDITOR_WIDGET: WidgetTemplate = {
  name: 'Native field editor',
  type: WidgetType.NativeFieldEditor,
  content: '',
  props: [],
};

export const getPossibleWidgets = (
  location: WidgetRenderLocation,
  _fieldId?: string
): WidgetTemplate[] => {
  if (location === 'Sidebar') {
    return POSSIBLE_BASE_WIDGETS;
  } else {
    return [...POSSIBLE_BASE_WIDGETS /*NATIVE_FIELD_EDITOR_WIDGET*/];
  }
};
