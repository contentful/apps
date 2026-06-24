import { IconFieldValue, IconWeight } from './icon';

/**
 * App installation parameters saved in ConfigScreen
 * Note: Contentful installation params only support scalar types in the UI.
 * We therefore store the enabled weights as a serialized string and
 * deserialize it in-app.
 */
export interface AppInstallationParameters {
  /** Enabled icon weights that users can select from */
  enabledWeights: IconWeight[] | string;
}

/**
 * Safely convert the stored installation parameter into an array of weights.
 */
export function parseEnabledWeights(
  raw: AppInstallationParameters['enabledWeights']
): IconWeight[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as IconWeight[];
      }
    } catch (err) {
      // Fall back to default below if parsing fails
    }
  }

  return ['regular'];
}

/**
 * Serialize enabled weights for storage in installation parameters.
 */
export function serializeEnabledWeights(weights: IconWeight[]): string {
  return JSON.stringify(weights);
}

/**
 * Parameters passed when opening the dialog
 */
export interface DialogInvocationParameters {
  /** Current field value, if any */
  currentValue?: IconFieldValue;
  /** Enabled weights from app configuration */
  enabledWeights: IconWeight[];
}
