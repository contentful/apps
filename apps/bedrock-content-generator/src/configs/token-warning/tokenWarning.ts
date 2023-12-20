export type TokenWarning = {
  warningText: string;
  substring: string;
  link: string;
};

const TOKEN_WARNING = "Generating content incurs a cost."; //TODO: Add link to Amazon Bedrock pricing page
const TOKEN_SUBSTRING = "OpenAI tokens.";
const TOKEN_LINK = "https://openai.com/pricing";

export const tokenWarning: TokenWarning = {
  warningText: TOKEN_WARNING,
  substring: TOKEN_SUBSTRING,
  link: TOKEN_LINK,
};
