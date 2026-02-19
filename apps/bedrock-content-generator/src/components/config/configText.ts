import { ProfileFields } from './appInstallationParameters';

const ModelText = {
  title: 'Machine Learning Model',
  helpText:
    "If you don't know which model to choose, we suggest starting with Anthropic Claude v3 Sonnet, " +
    'which is the most capable model. To maximize compatibility, this app only supports a subset of all possible models. Models have different capabilities and prices. For an overview, visit the AWS console.',
  linkSubstring: 'AWS console',
  link: 'https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/models',
};

const RegionText = {
  title: 'AWS Region',
  helpText:
    'Select the AWS region to use for accessing Amazon Bedrock. Not all models are available in all regions. For the broadest choice of models, choose US East or US West. Learn more in the documentation.',
  linkSubstring: 'documentation',
  link: 'https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html',
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
    title: 'Is there anything else that the model should know about your brand or product?',
    textAreaPlaceholder:
      'Example: Contentful is a leading composable content platform. It was a headless CMS category maker that now has company in the marketplace, but remains to be the preferred choice for medium, large and enterprise companies.',
    fieldType: FieldTypes.TEXTAREA,
    textLimit: 1000,
  },
];
const AccessKeyText = {
  accessKeyIDTitle: 'AWS Access Key ID',
  secretAccessKeyTitle: 'AWS Secret Access Key',
  helpText:
    'AWS IAM user credentials. You need administrator permissions to an AWS account to create an IAM user. Please use this documentation to create a new IAM user with minimum permissions with a few clicks. Re-using an existing user and its credentials is a security risk and may lead to severe negative business impact, such as data disclosure to third parties.',
  linkSubstring: 'documentation',
  link: 'https://github.com/contentful/apps/tree/master/apps/bedrock-content-generator/aws_setup',
};

const Sections = {
  pageHeading: 'Set up AI Content Generator powered by Amazon Bedrock',
  configHeading: 'Configuration',
  brandHeading: 'Brand profile',
  brandDescription:
    'Add details about your brand to power accurate and on-brand content for all of your prompts.',
  addToSidebarHeading: 'Add to sidebar views',
  addToSidebarDescription: 'Assign Content Generator to content types.',
  featureSelectionHeading: 'Feature selection',
  featureSelectionDescription:
    'Select which AI features should be available in the sidebar. At least one feature must be enabled.',
  costHeading: 'Cost',
  costSubheading:
    'Using this app incurs AWS costs, depending on the amount of tokens you generate.',
  costDescription:
    'The cost depends on the region and model you choose. View the current pricing at aws.amazon.com/bedrock/pricing.',
  costLinkSubstring: 'aws.amazon.com/bedrock/pricing',
  costLink: 'https://aws.amazon.com/bedrock/pricing/',
  rateLimitDescription:
    'If you plan to use this app very heavily, make sure to read the service quota documentation.',
  rateLimitLinkSubstring: 'service quota documentation',
  rateLimitLink: 'https://docs.aws.amazon.com/bedrock/latest/userguide/quotas.html',
  disclaimerHeading: 'Disclaimer',
  disclaimerDescription:
    "This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your company's policies, and all other Terms and Policies",
  disclaimerLinkSubstring: 'Terms and Policies',
  disclaimerLink: 'https://aws.amazon.com/bedrock/security-compliance/',
};

const ConfigErrors = {
  missingAccessKeyID: 'Missing Access Key ID',
  missingSecretAccessKey: 'Missing Secret Access Key',
  invalidCredentials: 'Credentials are invalid',

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

export {
  AccessKeyText,
  BrandProfileFields,
  ConfigErrors,
  ContentTypeText,
  ModelText,
  RegionText,
  Sections,
};
