import { ProfileFields } from "./appInstallationParameters";

const ModelText = {
  title: "Machine Learning Model",
  helpText:
    "According to the provider, there are different models with individual strengths and weaknesses " +
    "depending on your needs, try different models to find the perfect fit for you " +
    "as some are more capable than others.",
};

const RegionText = {
  title: "AWS Region",
  helpText:
    "Select the AWS region to use for accessing the Bedrock API. Bedrock isn't yet available in every region and model availability differs by region. Check the documentation for up-to-date information.",
  linkSubstring: "documentation",
  link: "https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html#bedrock-regions",
};

export enum FieldTypes {
  TEXTAREA = "textarea",
  TEXTINPUT = "textinput",
}

const BrandProfileFields = [
  {
    id: ProfileFields.PROFILE,
    title: "Describe your brand or product.",
    textAreaPlaceholder:
      "Example: Contentful is a headless content management system.",
    fieldType: FieldTypes.TEXTAREA,
    textLimit: 1000,
  },
  {
    id: ProfileFields.VALUES,
    title: "What are your brand's values and attributes?",
    textAreaPlaceholder: "Example: Bold, unique, young",
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.TONE,
    title: "Describe your brand's voice and tone.",
    textAreaPlaceholder: "Example: Humorous, absurd, kind",
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.EXCLUDE,
    title: "Are there any words your brand should never use?",
    textAreaPlaceholder: "Example: Humorous, absurd, kind",
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.INCLUDE,
    title: "Are there any words your brand should commonly use?",
    textAreaPlaceholder: "Example: Humorous, absurd, kind",
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.AUDIENCE,
    title: "Describe your brand's target audience.",
    textAreaPlaceholder: "Example: Men and women ages 18-24 who love fashion.",
    fieldType: FieldTypes.TEXTINPUT,
    textLimit: 200,
  },
  {
    id: ProfileFields.ADDITIONAL,
    title:
      "Is there anything else that AI should know about your brand or product?",
    textAreaPlaceholder:
      "Example: Contentful is a leading composable content platform. It was a headless CMS category maker that now has company in the marketplace, but remains to be the preferred choice for medium, large and enterprise companies.",
    fieldType: FieldTypes.TEXTAREA,
    textLimit: 1000,
  },
];
const AccessKeyText = {
  accessKeyIDTitle: "AWS Access Key ID",
  secretAccessKeyTitle: "AWS Secret Access Key",
  helpText:
    "AWS Access Key. If you need to generate a key, visit our documentation(TODO) on creating a new IAM User and generating an access key.",
  linkSubstring: "documentation",
  link: "https://example.com",
};

const Sections = {
  pageHeading: "Set up AI Content Generator",
  configHeading: "Configuration",
  brandHeading: "Brand profile",
  brandDescription:
    "Add details about your brand to power accurate and on-brand content for all of your prompts.",
  addToSidebarHeading: "Add to sidebar views",
  addToSidebarDescription: "Assign AI Content Generator to content types.",
  costHeading: "Cost",
  costSubheading:
    "Generating content uses AWS resources, depending on the amount of tokens you generate.",
  costDescription:
    "View the current pricing model at aws.amazon.com/bedrock/pricing",
  costLinkSubstring: "aws.amazon.com/bedrock/pricing",
  costLink: "https://aws.amazon.com/bedrock/pricing/",
  rateLimitDescription: "AWS enforces quota limitation. Learn about AWS quotas",
  rateLimitLinkSubstring: "AWS quotas",
  rateLimitLink:
    "https://docs.aws.amazon.com/bedrock/latest/userguide/quotas.html",
  disclaimerHeading: "Disclaimer",
  disclaimerDescription:
    "This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your company's policies, and all other Terms and Policies",
  disclaimerLinkSubstring: "Terms and Policies",
  disclaimerLink: "https://aws.amazon.com/bedrock/security-compliance/",
};

const ConfigErrors = {
  missingAccessKeyID: "Missing Access Key ID",
  missingSecretAccessKey: "Missing Secret Access Key",
  invalidCredentials: "Credentials are invalid",

  missingModel: "A valid model must be selected",
  exceededCharacterLimit:
    "One or more profile fields exceeds the character limit",
  noContentTypes:
    "There are no content types available in this environment. You can add a content type and then assign it to the app from this screen.",
  noContentTypesSubstring: "add a content type",
  failedToSave: "Failed to save:",
};

const ContentTypeText = {
  allText: "Select all Content Types",
  specificText: "Select specific content types",
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
