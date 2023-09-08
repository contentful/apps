export type TokenWarning = {
  warningText: string;
  substring: string;
  link: string;
};

const TOKEN_WARNING = 'Generating content uses OpenAI tokens.';
const TOKEN_SUBSTRING = 'OpenAI tokens.';
const TOKEN_LINK = 'https://openai.com/pricing';

export const tokenWarning: TokenWarning = {
  warningText: TOKEN_WARNING,
  substring: TOKEN_SUBSTRING,
  link: TOKEN_LINK,
};
