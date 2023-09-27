import { ProfileFields } from './appInstallationParameters';

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
    id: ProfileFields.PROFILE,
    title: 'Describe your brand or product.',
    textAreaPlaceholder: 'Example: Contentful is a headless content management system.',
    fieldType: FieldTypes.TEXTAREA,
    textLimit: 1000,
  },
  {
    id: ProfileFields.VALUES,
    title: "What are your brand's values and attributes?",
    textAreaPlaceholder: 'Example: Bold, unique, young',
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.TONE,
    title: "Describe your brand's voice and tone.",
    textAreaPlaceholder: 'Example: Humorous, absurd, kind',
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.EXCLUDE,
    title: 'Are there any words your brand should never use?',
    textAreaPlaceholder: 'Example: Humorous, absurd, kind',
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.INCLUDE,
    title: 'Are there any words your brand should commonly use?',
    textAreaPlaceholder: 'Example: Humorous, absurd, kind',
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.AUDIENCE,
    title: "Describe your brand's target audience.",
    textAreaPlaceholder: 'Example: Men and women ages 18-24 who love fashion.',
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.ADDITIONAL,
    title: 'Is there anything else that AI should know about your brand or product?',
    textAreaPlaceholder:
      'Example: Contentful is a leading composable content platform. It was a headless CMS category maker that now has company in the marketplace, but remains to be the preferred choice for medium, large and enterprise companies.',
    fieldType: FieldTypes.TEXTAREA,
    textLimit: 1000,
  },
];

const APIKeyText = {
  title: 'OpenAI API Key',
  helpText:
    'Enter your OpenAI API Key. If you need to generate a key, visit your OpenAI API Keys page',
  linkSubstring: 'OpenAI API Keys page',
  link: 'https://platform.openai.com/account/api-keys',
};

const Sections = {
  pageHeading: 'Set up AI Content Generator',
  configHeading: 'Configuration',
  brandHeading: 'Brand profile',
  brandDescription:
    'Add details about your brand to power accurate and on-brand content for all of your prompts.',
  addToSidebarHeading: 'Add to sidebar views',
  addToSidebarDescription: 'Assign AI Content Generator to content types.',
  costHeading: 'Cost',
  costSubheading: 'Generating content uses your Open AI tokens.',
  costDescription: 'View the current pricing model at openai.com/pricing',
  costLinkSubstring: 'openai.com/pricing',
  costLink: 'https://openai.com/pricing',
  disclaimerHeading: 'Disclaimer',
  disclaimerDescription:
    "This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your company's policies, and all other Terms and Policies",
  disclaimerLinkSubstring: 'Terms and Policies',
  disclaimerLink: 'https://openai.com/policies',
};

const ConfigErrors = {
  missingApiKey: 'Invalid or missing API Key',
  missingModel: 'A valid model must be selected',
  exceededCharacterLimit: 'One or more profile fields exceeds the character limit',
  noContentTypes:
    'There are no content types available in this environment. You can add a content type and then assign it to the app from this screen.',
  noContentTypesSubstring: 'add a content type',
  failedToSave: 'Failed to save:',
};

const ContentTypeText = {
  allText: 'Select all Content Types',
  specificText: 'Select specific content types',
};

export { ModelText, BrandProfileFields, APIKeyText, Sections, ConfigErrors, ContentTypeText };
