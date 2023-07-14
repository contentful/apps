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
    title: 'Title',
    helpText: 'Help text',
    prompt: titlePrompt,
  },
  [AIFeature.CONTENT]: {
    title: 'Content',
    helpText: 'Generate content based off of your data',
    prompt: contentPrompt,
  },
  [AIFeature.TRANSLATE]: {
    title: 'Translate',
    helpText: 'Help text',
    prompt: translatePrompt,
  },
  [AIFeature.SEO_KEYWORDS]: {
    title: 'Seo Keywords',
    helpText: 'Help text',
    prompt: seoKeywordsPrompt,
  },
  [AIFeature.SEO_DESCRIPTION]: {
    title: 'Seo Description',
    helpText: 'Help text',
    prompt: seoDescriptionPrompt,
  },
};

export default featureConfig;
export { AIFeature };
