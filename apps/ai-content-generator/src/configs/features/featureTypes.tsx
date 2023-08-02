import { AIFeature } from './featureConfig';

/**
 * Core Types
 */

export type Prompt = (input: string, targetLocale: string) => string;

/**
 * Feature Items
 */

type FeatureItem = {
  dialogTitle: string;
  buttonTitle: string;
  prompt: Prompt;
  messageSuffix: string;
};

/**
 * Feature Config
 */

export type FeatureConfig = {
  [key in AIFeature]: FeatureItem;
};
