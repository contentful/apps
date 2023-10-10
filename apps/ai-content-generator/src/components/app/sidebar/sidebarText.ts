const warningMessages = {
  profileMissing: `Missing brand profile. Visit the app configuration page.`,
  paramsMissing: `Invalid or missing API Key. Visit the app configuration page.`,
  linkSubstring: `Visit the app configuration page.`,
  unavailable: `Chat GPT is currently unavailable.`,
  defaultError: 'An unknown error occurred. Please try again.',
  openAiErrorMessage: 'OpenAI API Error:',
};

const disclaimerMessage = {
  body: `This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your company's policies, and all other Terms and Policies`,
  substring: `Terms and Policies`,
  link: `https://openai.com/policies`,
};

export { warningMessages, disclaimerMessage };
