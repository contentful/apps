import { FeatureConfig } from './featureTypes';
import translatePrompt from '@configs/prompts/translatePrompt';
import contentPrompt from '@configs/prompts/contentPrompt';
import seoKeywordsPrompt from '@configs/prompts/seoKeywordsPrompt';
import seoDescriptionPrompt from '@configs/prompts/seoDescriptionPrompt';
import titlePrompt from '@configs/prompts/titlePrompt';

enum AIFeature {
  TITLE = 'title',
  CONTENT = 'content',
  TRANSLATE = 'translate',
  SEO_DESCRIPTION = 'seoDescription',
  SEO_KEYWORDS = 'seoKeywords',
}

const featureConfig: FeatureConfig = {
  [AIFeature.TITLE]: {
    dialogTitle: 'Generate a title',
    buttonTitle: 'Title',
    messageSuffix: 'generate a title',
    prompt: titlePrompt,
  },
  [AIFeature.CONTENT]: {
    dialogTitle: 'Generate content',
    buttonTitle: 'Content',
    messageSuffix: 'generate content',
    prompt: contentPrompt,
  },
  [AIFeature.TRANSLATE]: {
    dialogTitle: 'Language translation',
    buttonTitle: 'Translate',
    messageSuffix: 'translate',
    prompt: translatePrompt,
  },
  [AIFeature.SEO_KEYWORDS]: {
    dialogTitle: 'Generate SEO keywords',
    buttonTitle: 'SEO Keywords',
    messageSuffix: 'generate SEO Keywords',
    prompt: seoKeywordsPrompt,
  },
  [AIFeature.SEO_DESCRIPTION]: {
    dialogTitle: 'Generate an SEO description',
    buttonTitle: 'SEO description',
    messageSuffix: 'generate an SEO description',
    prompt: seoDescriptionPrompt,
  },
};

export default featureConfig;
export { AIFeature };
