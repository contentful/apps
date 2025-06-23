const configPageCopies = {
  apiKeySection: {
    sectionTitle: 'Open AI Key',
    linkBody: 'Provide your Open AI API key. If you need to generate a key, visit openai.com',
    linkSubstring: 'visit openai.com',
    linkHref: 'https://openai.com',
  },
  costSection: {
    sectionTitle: 'Cost',
    sectionSubheading: 'Generating images uses your DALL-E credits.',
    pricingLinkBody: 'View the current pricing model at openai.com/pricing',
    pricingLinkSubstring: 'openai.com/pricing',
    pricingLinkHref: 'https://openai.com/pricing',
    creditLinkBody: 'View your current credits at labs.openai.com/account',
    creditLinkSubstring: 'labs.openai.com/account',
    creditLinkHref: 'https://labs.openai.com/account',
    learnMoreBody: 'Learn more about how DALL-E credits work at labs.openai.com/about',
    learnMoreSubstring: 'labs.openai.com/about',
    learnBodyHref: 'https://labs.openai.com/about',
  },
  disclaimerSection: {
    sectionTitle: 'Disclaimer',
    linkBody:
      "This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your company's policies, and all other Terms and Policies",
    linkSubstring: 'Terms and Policies',
    linkHref: 'https://openai.com/policies',
  },
  gettingStartedSection: {
    sectionTitle: 'Getting Started',
    generateImageSubtitle: 'Generate an image',
    selectAndEditSubtitle: 'Select and edit',
    sectionSubHeading1:
      'To generate a new image using AI, create a new media asset from the media library or from any content entry page with a media field. Then, a dialog will open inviting you to write a prompt.',
    sectionSubHeading2: 'To edit a portion of an asset using AI, select the AI icon button.',
    // docs not implemented yet, leaving here for future us
    linkBody: 'Read the docs',
    linkSubstring: 'Read the docs',
    linkHref: 'https://www.contentful.com/help/ai-image-generator',
  },
  configPage: {
    pageTitle: 'Set up AI Images powered by DALL-E',
  },
};

export default configPageCopies;
