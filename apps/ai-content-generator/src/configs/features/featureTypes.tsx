import { AIFeature } from './featureConfig';

/**
 * Core Types
 */

export type Prompt = (input: string, targetLocale: string) => string;

export type FeatureComponentProps = {
  isTranslate?: boolean;
};

/**
 * Feature Items
 */

type FeatureItem = {
  title: string;
  helpText: string;
  prompt: Prompt;
};

/**
 * Feature Config
 */

export type FeatureConfig = {
  [key in AIFeature]: FeatureItem;
};
