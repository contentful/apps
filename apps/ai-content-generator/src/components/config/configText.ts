const ModelText = {
  title: 'Machine Learning Model',
  helpText:
    'According to the provider, for many basic tasks, the difference between GPT-4 and GPT-3.5 ' +
    'models is not significant. However, in more complex reasoning situations, GPT-4 is much more ' +
    'capable than any previous models.',
};

export enum FieldTypes {
  TEXTAREA = 'textarea',
  TEXTINPUT = 'textinput',
}

const BrandProfileFields = [
  {
    id: 'profile',
    title: 'Describe your brand or product.',
    textAreaPlaceholder: 'Example: Contentful is a headless content management system.',
    isRequired: true,
    fieldType: FieldTypes.TEXTAREA,
  },
  {
    id: 'link',
    title:
      'Does your brand have a published brand guide or copy guidelines? If so, provide a link.',
    textAreaPlaceholder: 'Example: http://mybrand/voiceandtone.com',
    isRequired: false,
    fieldType: FieldTypes.TEXTINPUT,
  },
  {
    id: 'values',
    title: "What are your brand's values and attributes?",
    textAreaPlaceholder: 'Example: Bold, unique, young',
    isRequired: false,
    fieldType: FieldTypes.TEXTINPUT,
  },
  {
    id: 'tone',
    title: "Describe your brand's voice and tone.",
    textAreaPlaceholder: 'Example: Humorous, absurd, kind',
    isRequired: false,
    fieldType: FieldTypes.TEXTINPUT,
  },
  {
    id: 'exclude',
    title: 'Are there any words your brand should never use?',
    textAreaPlaceholder: 'Example: Humorous, absurd, kind',
    isRequired: false,
    fieldType: FieldTypes.TEXTINPUT,
  },
  {
    id: 'include',
    title: 'Are there any words your brand should commonly use?',
    textAreaPlaceholder: 'Example: Humorous, absurd, kind',
    isRequired: false,
    fieldType: FieldTypes.TEXTINPUT,
  },
  {
    id: 'audience',
    title: "Describe your brand's target audience.",
    textAreaPlaceholder: 'Example: Men and women ages 18-24 who love fashion.',
    isRequired: false,
    fieldType: FieldTypes.TEXTINPUT,
  },
  {
    id: 'additional',
    title: 'Is there anything else that AI should know about your brand or product?',
    textAreaPlaceholder:
      'Example: Contentful is a leading composable content platform. It was a headless CMS category maker that now has company in the marketplace, but remains to be the preferred choice for medium, large and enterprise companies.',
    isRequired: false,
    fieldType: FieldTypes.TEXTAREA,
  },
];

const APIKeyText = {
  title: 'OpenAI API Key',
  helpText: 'Enter your OpenAI API key. If you need to generate a key, visit openai.com',
  linkSubstring: 'openai.com',
};

const Sections = {
  pageHeading: 'Set up AI Content Generator',
  configHeading: 'Configuration',
  brandHeading: 'Brand profile',
  brandDescription:
    'Add details about your brand to power accurate and on-brand content for all of your prompts.',
};

export { ModelText, BrandProfileFields, APIKeyText, Sections };
