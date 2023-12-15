import { AIFeature } from './featureConfig';

/**
 * Core Types
 */

export type Prompt = (input: string, targetLocale: string, ...args: string[]) => string;

/**
 * Feature Items
 */

export type DialogText = {
  fieldHelpText: string;
  fieldPlaceholder: string;
  promptHelpText: string;
  promptPlaceholder: string;
};

type FeatureItem = {
  dialogTitle: string;
  buttonTitle: string;
  prompt: Prompt;
  dialogText: DialogText;
};

/**
 * Feature Config
 */

export type FeatureConfig = {
  [key in AIFeature]: FeatureItem;
};
