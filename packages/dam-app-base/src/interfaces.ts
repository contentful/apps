import { DialogExtensionSDK, FieldExtensionSDK } from '@contentful/app-sdk';

/**
 * Object containing all information configured on the app configuration page.
 */
export type Config = Record<string, any>;

/**
 * Object containing data about the asset. Shape and values are DAM service specific.
 */
export type Asset = Record<string, any>;

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

/**
 * Custom code that validates installation parameters that is run before saving.
 *
 * @param parameters Object containg the entered parameters.
 * @returns `string` containing an error message. `null` if the parameters are valid.
 */
export type ValidateParametersFn = (parameters: Record<string, any>) => string | null;

/**
 * Returns the url of the thumbnail of an asset.
 *
 * @param asset Asset
 * @param config App configuration
 * @returns Tuple containing (1) the url and (2) the text represantation of the asset (optional)
 */
export type ThumbnailFn = (asset: Asset, config: Config) => [string, string | undefined];

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
 * Function that gets called when app wants to open a dialog. Should return an updated list of assets as a Promise.
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
 * @param currentValue List of currently selected assets
 * @param config App configuration
 * @returns Promise containing a list of selected assets
 */
export type OpenDialogFn = (
  sdk: FieldExtensionSDK,
  currentValue: Asset[],
  config: Config
) => Promise<Asset[]>;

/**
 * Function that should return true when the button should be disabled.
 *
 * @param currentValue Currently selected assets
 * @param config App configuration
 * @returns true, if the button in the field location should be disabled. false, if the button should be enabled
 */
export type DisabledPredicateFn = (currentValue: Asset[], config: Config) => boolean;

/**
 * Async function that takes in context about the current field value, the result from the dialog, and the app config
 * It also accepts a function to update the field state, and this should be called in the function to update the field
 *
 * @param context { currentValue, result, config }
 * @return Promise<void>, calls the async function updateStateValue
 */
export type CustomUpdateStateValueFn = (
  context: {
    currentValue: Asset[];
    result: Asset[];
    config: Config;
  },
  updateStateValue: (value: Asset[]) => void
) => Promise<void>;

/**
 * Object containing additional data about the asset to display as primary and secondary information in the "more details" section
 */
export type AdditionalData = { primary: string; secondary: string };

/**
 * Function that return an object that represents the primary and secondary data that should be displayed
 * in the "more details" section of the asset card
 *
 * @param asset an asset
 * @return object with primary and secondary properties that contain strings to display in the asset card
 */
export type GetAdditionalDataFn = (asset: Asset) => AdditionalData;

export interface Integration {
  /**
   * Text on the button that is displayed in the field location
   */
  cta: string;

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
   * Returns the url of the thumbnail of an asset.
   *
   * @param asset Asset
   * @param config App configuration
   * @returns Tuple containing (1) the url and (2) the text represantation of the asset (optional)
   */
  makeThumbnail: ThumbnailFn;

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
   * Function that gets called when app wants to open a dialog. Should return an updated list of assets as a Promise.
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
   * @param currentValue List of currently selected assets
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

  /**
   * Optional async function that will override the current updateStateValue function
   * This custom function accepts context about the asset as well as the updateStateValue function,
   * which should be called within the custom function
   * A use case for this is to change the default behavior where newly selected assets are appended to the current field value
   * This is optional and if not provided, the default behavior of appending the result will be applied
   */
  customUpdateStateValue?: CustomUpdateStateValueFn;

  /**
   * Optional function to get additional data from the asset to be displayed in the asset card
   * This function accepts asset info and returns an object that contains primary and secondary information to display
   * When this function is used, a "more details" section will appear on the asset card
   * This is optional and if not provided, the default look of the asset card will remain
   */
  getAdditionalData?: GetAdditionalDataFn;
}
