const warningMessages = {
  profileMissing: `Brand profile is not configured for this app. In order to power more accurate and on-brand content for all of your prompts, please update your app configuration page.`,
  paramsMissing: `App installation parameters are missing. Please update your app configuration page.`,
  linkSubstring: `app configuration page.`,
};

const disclaimerMessage = {
  body: `This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your company's policies, and all other Terms and Policies`,
  substring: `Terms and Policies`,
  link: `https://openai.com/policies`,
};

export { warningMessages, disclaimerMessage };
