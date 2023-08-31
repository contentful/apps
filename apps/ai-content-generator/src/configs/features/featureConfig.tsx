import { FeatureConfig } from './featureTypes';
import translatePrompt from '@configs/prompts/translatePrompt';
import contentPrompt from '@configs/prompts/contentPrompt';
import seoKeywordsPrompt from '@configs/prompts/seoKeywordsPrompt';
import seoDescriptionPrompt from '@configs/prompts/seoDescriptionPrompt';
import titlePrompt from '@configs/prompts/titlePrompt';
import rewritePrompt from '@configs/prompts/rewritePrompt';

enum AIFeature {
  TITLE = 'title',
  CONTENT = 'content',
  TRANSLATE = 'translate',
  SEO_DESCRIPTION = 'seoDescription',
  SEO_KEYWORDS = 'seoKeywords',
  REWRITE = 'rewrite',
}

const FIELD_HELP_TEXT_BASE = 'Select a source field and output field';
const FIELD_PLACEHOLDER = 'Your source and results will appear here...';
const PROMPT_HELP_TEXT_BASE = 'Select an output field and';
const TOKEN_WARNING = 'Generating content uses Chat GPT tokens.';
const TOKEN_SUBSTRING = 'Chat GPT tokens.';
const TOKEN_LINK = 'https://openai.com/pricing';

const tokenWarning = {
  warningText: TOKEN_WARNING,
  substring: TOKEN_SUBSTRING,
  link: TOKEN_LINK,
};

const featureConfig: FeatureConfig = {
  [AIFeature.TITLE]: {
    dialogTitle: 'Generate a title',
    buttonTitle: 'Generate title',
    prompt: titlePrompt,
    dialogText: {
      fieldHelpText: `${FIELD_HELP_TEXT_BASE} to generate a title`,
      fieldPlaceholder: FIELD_PLACEHOLDER,
      promptHelpText: `${PROMPT_HELP_TEXT_BASE} enter a prompt to generate a title`,
      promptPlaceholder:
        "Write a prompt, for example...\nAn article about quantum computing in simple terms\nA blog post about creative ideas for a 10 year old's birthday\nA tutorial about making an HTTP request in JavaScript",
      tokenWarning,
    },
  },
  [AIFeature.CONTENT]: {
    dialogTitle: 'Generate content',
    buttonTitle: 'Generate content',
    prompt: contentPrompt,
    dialogText: {
      fieldHelpText: `${FIELD_HELP_TEXT_BASE} to generate content`,
      fieldPlaceholder: FIELD_PLACEHOLDER,
      promptHelpText: `${PROMPT_HELP_TEXT_BASE} enter a prompt to generate content`,
      promptPlaceholder:
        "Write a prompt, for example...\nExplain quantum computing in simple terms\nGot any creative ideas for a 10 year old's birthday?\nHow do I make an HTTP request in JavaScript?",
      tokenWarning,
    },
  },
  [AIFeature.TRANSLATE]: {
    dialogTitle: 'Language translation',
    buttonTitle: 'Language translation',
    prompt: translatePrompt,
    dialogText: {
      fieldHelpText: `${FIELD_HELP_TEXT_BASE} to generate a translation`,
      fieldPlaceholder: FIELD_PLACEHOLDER,
      promptHelpText: `${PROMPT_HELP_TEXT_BASE} enter content to generate a translation`,
      promptPlaceholder:
        "Enter content here to translate it according to the output field's language...",
      tokenWarning,
    },
  },
  [AIFeature.REWRITE]: {
    dialogTitle: 'Rewrite',
    buttonTitle: 'Rewrite',
    prompt: rewritePrompt,
    dialogText: {
      fieldHelpText: `${FIELD_HELP_TEXT_BASE}, then add tone instructions.`,
      fieldPlaceholder: FIELD_PLACEHOLDER,
      promptHelpText: `${PROMPT_HELP_TEXT_BASE} and then add tone instructions.`,
      promptPlaceholder: 'Enter content here to rewrite it...',
      tokenWarning,
    },
  },
  [AIFeature.SEO_KEYWORDS]: {
    dialogTitle: 'Generate SEO keywords',
    buttonTitle: 'SEO Keywords',
    prompt: seoKeywordsPrompt,
    dialogText: {
      fieldHelpText: `${FIELD_HELP_TEXT_BASE} to generate SEO keywords`,
      fieldPlaceholder: FIELD_PLACEHOLDER,
      promptHelpText: `${PROMPT_HELP_TEXT_BASE} enter content to generate SEO keywords`,
      promptPlaceholder: 'Enter content here to generate SEO keywords...',
      tokenWarning,
    },
  },
  [AIFeature.SEO_DESCRIPTION]: {
    dialogTitle: 'Generate SEO description',
    buttonTitle: 'SEO Description',
    prompt: seoDescriptionPrompt,
    dialogText: {
      fieldHelpText: `${FIELD_HELP_TEXT_BASE} to generate SEO description`,
      fieldPlaceholder: FIELD_PLACEHOLDER,
      promptHelpText: `${PROMPT_HELP_TEXT_BASE} enter content to generate SEO description`,
      promptPlaceholder: 'Enter content here to generate SEO description...',
      tokenWarning: tokenWarning,
    },
  },
};

export default featureConfig;
export { AIFeature };
