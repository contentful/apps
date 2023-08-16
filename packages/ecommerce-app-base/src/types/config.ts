/**
 * Object containing all information configured on the app configuration page.
 */
export type Config = Record<string, unknown>;

/**
 * Definition of app configuration parameters
 */
export type ParameterDefinition = {
  /**
   * Unique id. Used as key in Config object.
   */
  id: string;

  /**
   * Name / Label
   */
  name: string;

  /**
   * Short description/explanation
   */
  description: string;

  /**
   * Default value
   */
  default?: unknown;

  /**
   * Parameter type
   * - Symbol: Text
   * - List: List of texts
   * - Number: Integer
   */
  type: 'Symbol' | 'List' | 'Number';

  /**
   * Whether it is possible without providing a value.
   */
  required: boolean;
};
