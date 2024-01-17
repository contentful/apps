const warningMessages = {
  // TODO
  profileMissing: `Missing brand profile. Visit the app configuration page.`,
  paramsMissing: `Invalid or missing authentication. Visit the app configuration page.`,
  linkSubstring: `Visit the app configuration page.`,
  unavailable: `Amazon Bedrock is currently unavailable.`,
  defaultError: "An unknown error occurred. Please try again.",
  BedrockErrorMessage: "Amazon Bedrock Error:",
};

const disclaimerMessage = {
  body: `This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your company's policies, and all other AWS Service Terms.`,
  substring: `AWS Service Terms.`,
  link: `https://aws.amazon.com/service-terms/`,
};

export { disclaimerMessage, warningMessages };
