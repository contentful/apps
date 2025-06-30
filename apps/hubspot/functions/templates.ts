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

export const RICH_TEXT_FIELD_TEMPLATE = [
  {
    name: 'richtext_field',
    label: 'Rich text',
    type: 'richtext',
    default: '',
  },
];

export const NUMBER_FIELD_TEMPLATE = [
  {
    name: 'number_field',
    label: 'Number',
    display: 'text',
    step: 1,
    type: 'number',
    default: 0,
  },
];

export const DATE_FIELD_TEMPLATE = [
  {
    name: 'date_field',
    label: 'Date',
    type: 'date',
    default: 0,
  },
];

export const DATETIME_FIELD_TEMPLATE = [
  {
    name: 'datetime_field',
    label: 'Date and time',
    step: 30,
    type: 'datetime',
    default: 0,
  },
];

export const IMAGE_FIELD_TEMPLATE = [
  {
    name: 'image_field',
    label: 'Image',
    responsive: true,
    resizable: true,
    show_loading: false,
    type: 'image',
    default: {
      src: '',
      loading: 'lazy',
      width: 0,
      height: 0,
    },
  },
];

export const TEXT_MODULE_TEMPLATE =
  '{% inline_text field="text_field" value="{{ module.text_field }}" %}';

export const RICH_TEXT_MODULE_TEMPLATE =
  '{% inline_rich_text field="richtext_field" value="{{ module.richtext_field }}" %}';

export const NUMBER_MODULE_TEMPLATE = '{{ module.number_field }}';

export const DATE_MODULE_TEMPLATE = '{{ module.date_field }}';

export const DATETIME_MODULE_TEMPLATE = '{{ module.datetime_field }}';

export const IMAGE_MODULE_TEMPLATE = `
{% if module.image_field.src %}
	{% set sizeAttrs = 'width="{{ module.image_field.width|escape_attr }}" height="{{ module.image_field.height|escape_attr }}"' %}
	{% if module.image_field.size_type == 'auto' %}
		{% set sizeAttrs = 'width="{{ module.image_field.width|escape_attr }}" height="{{ module.image_field.height|escape_attr }}" style="max-width: 100%; height: auto;"' %}
	{% elif module.image_field.size_type == 'auto_custom_max' %}
		{% set sizeAttrs = 'width="{{ module.image_field.max_width|escape_attr }}" height="{{ module.image_field.max_height|escape_attr }}" style="max-width: 100%; height: auto;"' %}
	{% endif %}
	 {% set loadingAttr = module.image_field.loading != 'disabled' ? 'loading="{{ module.image_field.loading|escape_attr }}"' : '' %}
	<img src="{{ module.image_field.src|escape_url }}" alt="{{ module.image_field.alt|escape_attr }}" {{ loadingAttr }} {{ sizeAttrs }}>
{% endif %}`;
