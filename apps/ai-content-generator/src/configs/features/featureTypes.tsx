import { AIFeature } from './featureConfig';

/**
 * Core Types
 */

export type Prompt = (input: string, targetLocale: string) => string;

export type FeatureComponentProps = {
  isTranslate?: boolean;
  isTitle?: boolean;
};

/**
 * Feature Items
 */

type FeatureItem = {
  dialogTitle: string;
  buttonTitle: string;
  prompt: Prompt;
  description: string;
};

/**
 * Feature Config
 */

export type FeatureConfig = {
  [key in AIFeature]: FeatureItem;
};
