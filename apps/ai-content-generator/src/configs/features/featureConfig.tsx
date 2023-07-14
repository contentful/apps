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

export enum AIFeatureType {
  BASE = 'base',
}

const featureConfig: FeatureConfig = {
  [AIFeature.TITLE]: {
    title: 'Title',
    helpText: 'Help text',
    prompt: titlePrompt,
    featureType: AIFeatureType.BASE,
  },
  [AIFeature.CONTENT]: {
    title: 'Content',
    helpText: 'Generate content based off of your data',
    prompt: contentPrompt,
    featureType: AIFeatureType.BASE,
  },
  [AIFeature.TRANSLATE]: {
    title: 'Translate',
    helpText: 'Help text',
    prompt: translatePrompt,
    featureType: AIFeatureType.BASE,
  },
  [AIFeature.SEO_KEYWORDS]: {
    title: 'Seo Keywords',
    helpText: 'Help text',
    prompt: seoKeywordsPrompt,
    featureType: AIFeatureType.BASE,
  },
  [AIFeature.SEO_DESCRIPTION]: {
    title: 'Seo Description',
    helpText: 'Help text',
    prompt: seoDescriptionPrompt,
    featureType: AIFeatureType.BASE,
  },
};

export default featureConfig;
export { AIFeature };
