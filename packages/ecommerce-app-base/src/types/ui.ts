import { DialogAppSDK, FieldAppSDK } from '@contentful/app-sdk';
import { Config } from './config';
import { AdditionalDataDefaultType, Product } from './product';

/**
 * Returns the text that is displayed on the button in the field location.
 *
 * @param fieldType Type of the field the app is used for.
 * @param skuType SKU type of the current field. Undefined if only a single SKU type is supported by the app.
 * @returns Text that should be displayed on the button
 */
export type MakeCTAFn = (fieldType: string, skuType?: string) => string;

/**
 * Returns the text that is used for confirming the dialog selection.
 *
 * @param selectedSKUs An array of SKUs chosen.
 * @returns Text that should be displayed on the button
 */
export type MakeSaveBtnTextFn = (selectedSKUs: string[], skuType?: string) => string;

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
 * @param skuType SKU type of the current field. Undefined if only a single SKU type is supported by the app.
 * @returns List of Products which is used to render a preview.
 */
export type ProductPreviewsFn<AdditionalData = AdditionalDataDefaultType> = (
  skus: string[],
  config: Config,
  skuType?: string
) => Promise<Product<AdditionalData>[]>;
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
export type RenderDialogFn = (sdk: DialogAppSDK) => void;

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
  sdk: FieldAppSDK,
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
