import { DialogExtensionSDK, FieldExtensionSDK, ParametersAPI } from '@contentful/app-sdk';
import { FieldsConfig } from './components/fields';

/**
 * Object containing all information configured on the app configuration page.
 */
export type Config = Record<string, any>;

/**
 * Definition of app configuration parameters
 */
export interface ParameterDefinition {
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
  default?: any;

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
}

export interface SAPParameters extends ParametersAPI {
  installation: {
    apiEndpoint: string;
    baseSites: string;
  };
}

export interface Response {
  products: Product[];
  errors: Error[];
}

export interface Product {
  sku: string;
  image: string;
  id: string;
  name: string;
  externalLink?: string;
  isMissing?: boolean;
}

export interface Error {
  message: string;
  type: string;
}

export interface Pagination {
  offset: number;
  total: number;
  count: number;
  limit: number;
  hasNextPage?: boolean;
}

interface ProductsFnResponse {
  pagination: Pagination;
  products: Product[];
}

export type ProductsFn = (
  search: string,
  pagination?: Partial<Pagination>
) => Promise<ProductsFnResponse>;

/**
 * Returns the text that is displayed on the button in the field location.
 *
 * @param fieldType Type of the field the app is used for.
 * @returns Text that should be displayed on the button
 */
export type MakeCTAFn = (fieldType: string) => string;

/**
 * Custom code that validates installation parameters that is run before saving.
 *
 * @param parameters Object containg the entered parameters.
 * @returns `string` containing an error message. `null` if the parameters are valid.
 */
export type ValidateParametersFn = (parameters: Record<string, string>) => string | null;

/**
 * Function that returns a list for a given list of skus. The returned value is used to render a product preview.
 *
 * @param skus List of skus
 * @param config App configuration
 * @returns List of Products which is used to render a preview.
 */
export type ProductPreviewsFn = (skus: string[], config: Config) => Promise<Product[]>;
export type DeleteFn = (index: number) => void;

/**
 * Function that gets called within the Iframe when the app is rendered in a dialog location.
 *
 * @example
 * ```javascript
 * function renderDialog(sdk) {
 *   const config = sdk.parameters.invocation;
 *
 *   const container = document.createElement('div');
 *   container.innerHTML = `<iframe src="https://example.com/dam?folder=${config.folder}" width="400" height="650" style="border:none;"/>`;
 *   document.body.appendChild(container);
 * }
 * ```
 *
 * @param sdk [DialogExtensionSDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/)
 */
export type RenderDialogFn = (sdk: DialogExtensionSDK) => void;

/**
 * Function that gets called when app wants to open a dialog. Should return an updated list of skus as a Promise.
 *
 * You probably want to call [`sdk.openCurrentApp`](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#open-the-current-app-in-a-dialog).
 *
 * @example
 * ```javascript
 * async function openDialog(sdk, currentValue, config) {
 *   return await sdk.dialogs.openCurrentApp({
 *     parameters: { config, currentValue },
 *   });
 * }
 *
 * ```
 *
 * @param sdk [FieldExtensionSDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/)
 * @param currentValue List of currently selected akus
 * @param config App configuration
 * @returns Promise containing a list of selected skus
 */
export type OpenDialogFn = (
  sdk: FieldExtensionSDK,
  currentValue: string[] | string,
  config: Config
) => Promise<string[]>;

/**
 * Function that should return true when the button should be disabled.
 *
 * @param currentValue Currently selected skus
 * @param config App configuration
 * @returns true, if the button in the field location should be disabled. false, if the button should be enabled
 */
export type DisabledPredicateFn = (currentValue: string[], config: Config) => boolean;

export interface Integration {
  /**
   * Returns the text that is displayed on the button in the field location.
   *
   * @param fieldType Type of the field the app is used for.
   * @returns Text that should be displayed on the button
   */
  makeCTA: MakeCTAFn;

  /**
   * Name of the app
   */
  name: string;

  /**
   * Path to the app's logo
   */
  logo: string;

  /**
   * The app's primary color
   */
  color: string;

  /**
   * Short description of the app
   */
  description: string;

  /**
   * Parameter definition which can be customized on the app configuration page and used in the callback functions.
   */
  parameterDefinitions: ParameterDefinition[];

  /**
   * Custom code that validates installation parameters that is run before saving.
   *
   * @param parameters Object containg the entered parameters.
   * @returns `string` containing an error message. `null` if the parameters are valid.
   */
  validateParameters: ValidateParametersFn;

  /**
   * Function that returns a list for a given list of skus. The returned value is used to render a product preview.
   *
   * @param skus List of skus
   * @param config App configuration
   * @returns List of Products which is used to render a preview.
   */
  fetchProductPreviews: ProductPreviewsFn;

  /**
   * Function that gets called within the Iframe when the app is rendered in a dialog location.
   *
   * @example
   * ```javascript
   * function renderDialog(sdk) {
   *   const config = sdk.parameters.invocation;
   *
   *   const container = document.createElement('div');
   *   container.innerHTML = `<iframe src="https://example.com/dam?folder=${config.folder}" width="400" height="650" style="border:none;"/>`;
   *   document.body.appendChild(container);
   * }
   * ```
   *
   * @param sdk [DialogExtensionSDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/)
   */
  renderDialog: RenderDialogFn;

  /**
   * Function that gets called when app wants to open a dialog. Should return an updated list of skus as a Promise.
   *
   * You probably want to call [`sdk.openCurrentApp`](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#open-the-current-app-in-a-dialog).
   *
   * @example
   * ```javascript
   * async function openDialog(sdk, currentValue, config) {
   *   return await sdk.dialogs.openCurrentApp({
   *     parameters: { config, currentValue },
   *   });
   * }
   * ```
   *
   * @param sdk [FieldExtensionSDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/)
   * @param currentValue Array of currently selected skus
   * @param config App configuration
   * @returns Promise containing a list of selected assets
   */
  openDialog: OpenDialogFn;

  /**
   * Function that should return true when the button should be disabled.
   *
   * @param currentValue Currently selected assets
   * @param config App configuration
   * @returns true, if the button in the field location should be disabled. false, if the button should be enabled
   */
  isDisabled: DisabledPredicateFn;
}

export type Hash = Record<string, any>;

export interface Category {
  slug: string;
  id: string;
  name: string;
  externalLink?: string;
  isMissing?: boolean;
  sku: string;
  image: string;
}

export interface ConfigurationParameters {
  projectKey?: string;
  clientId?: string;
  clientSecret?: string;
  apiEndpoint?: string;
  authApiEndpoint?: string;
  locale?: string;
  fieldsConfig?: FieldsConfig;
  baseSites?: string;
}

export type PreviewsFn = (skus: string[], sapApplicationInterfaceKey: string) => Promise<Product[]>;

export type PickerMode = 'product' | 'category';

export type CheckBoxFn = (event: any) => void;

export type UpdateTotalPagesFn = (totalPages: number) => void;
