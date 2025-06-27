export const META_JSON_TEMPLATE = {
  global: false,
  content_types: ['EMAIL'],
  host_template_types: ['PAGE', 'BLOG_LISTING', 'BLOG_POST'],
  is_available_for_new_content: true,
};

export const TEXT_FIELD_TEMPLATE = [
  {
    name: 'text_field',
    label: 'Text',
    type: 'text',
    default: '',
  },
];

export const TEXT_MODULES_TEMPLATE =
  '{% inline_text field="text_field" value="{{ module.text_field }}" %}';
