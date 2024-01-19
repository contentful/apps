export type TokenWarning = {
  warningText: string;
  substring: string;
  link: string;
};

const TOKEN_WARNING = "Generating content incurs Amazon Bedrock charges.";
const TOKEN_SUBSTRING = "Amazon Bedrock charges.";
const TOKEN_LINK = "https://aws.amazon.com/bedrock/pricing";

export const tokenWarning: TokenWarning = {
  warningText: TOKEN_WARNING,
  substring: TOKEN_SUBSTRING,
  link: TOKEN_LINK,
};
