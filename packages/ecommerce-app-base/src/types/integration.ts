import {
  DisabledPredicateFn,
  MakeCTAFn,
  OpenDialogFn,
  ProductPreviewsFn,
  RenderDialogFn,
  ValidateParametersFn,
} from './ui';
import { ParameterDefinition } from './config';
import { ReactNode } from 'react';
import { Product } from './product';

export type SKUType = { id: string; name: string; default?: boolean };

export type ProductCardVersion = 'v1' | 'v2';

export type Integration<AdditionalData = undefined> = {
  isInOrchestrationEAP?: boolean;
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
   * @param parameters Object containing the entered parameters.
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
  fetchProductPreviews: ProductPreviewsFn<AdditionalData>;

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

  /**
   * If your app supports multiple sku types (for example - product, product variant, category...) you can provide a list here.
   * This configuration will be stored under the skuTypes key in your installation parameters.
   */
  skuTypes?: SKUType[];

  /**
   * Opt-in to the new Product Card component
   */
  productCardVersion?: ProductCardVersion;

  /**
   * render additional data with for Product Card version "v2"
   */
  additionalDataRenderer?: AdditionalDataRenderer<AdditionalData>;
};

export type AdditionalDataRendererProps<AdditionalData> = { product: Product<AdditionalData> };

export type AdditionalDataRenderer<AdditionalData = undefined> = (
  props: AdditionalDataRendererProps<AdditionalData>
) => ReactNode;
