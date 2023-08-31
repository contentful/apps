export type TokenWarning = {
  warningText: string;
  substring: string;
  link: string;
};

const TOKEN_WARNING = 'Generating content uses Chat GPT tokens.';
const TOKEN_SUBSTRING = 'Chat GPT tokens.';
const TOKEN_LINK = 'https://openai.com/pricing';

export const tokenWarning: TokenWarning = {
  warningText: TOKEN_WARNING,
  substring: TOKEN_SUBSTRING,
  link: TOKEN_LINK,
};
