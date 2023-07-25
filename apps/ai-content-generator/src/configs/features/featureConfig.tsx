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
    title: 'a title',
    buttonTitle: 'Title',
    helpText: '',
    prompt: titlePrompt,
  },
  [AIFeature.CONTENT]: {
    title: 'content',
    buttonTitle: 'Content',
    helpText: '',
    prompt: contentPrompt,
  },
  [AIFeature.TRANSLATE]: {
    title: 'Language translation',
    buttonTitle: 'Translate',
    helpText: '',
    prompt: translatePrompt,
  },
  [AIFeature.SEO_KEYWORDS]: {
    title: 'SEO keywords',
    buttonTitle: 'SEO Keywords',
    helpText: '',
    prompt: seoKeywordsPrompt,
  },
  [AIFeature.SEO_DESCRIPTION]: {
    title: 'an SEO description',
    buttonTitle: 'SEO description',
    helpText: '',
    prompt: seoDescriptionPrompt,
  },
};

export default featureConfig;
export { AIFeature };
