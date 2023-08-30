@contentful/ecommerce-app-base

# @contentful/ecommerce-app-base

## Table of contents

### Type Aliases

- [AdditionalDataRenderer](README.md#additionaldatarenderer)
- [AdditionalDataRendererProps](README.md#additionaldatarendererprops)
- [Config](README.md#config)
- [DeleteFn](README.md#deletefn)
- [DisabledPredicateFn](README.md#disabledpredicatefn)
- [Integration](README.md#integration)
- [MakeCTAFn](README.md#makectafn)
- [MakeSaveBtnTextFn](README.md#makesavebtntextfn)
- [OpenDialogFn](README.md#opendialogfn)
- [Pagination](README.md#pagination)
- [ParameterDefinition](README.md#parameterdefinition)
- [Product](README.md#product)
- [ProductCardVersion](README.md#productcardversion)
- [ProductPreviewsFn](README.md#productpreviewsfn)
- [ProductsFn](README.md#productsfn)
- [RenderDialogFn](README.md#renderdialogfn)
- [SKUType](README.md#skutype)
- [ValidateParametersFn](README.md#validateparametersfn)

### Functions

- [LinkDataItemRenderer](README.md#linkdataitemrenderer)
- [MetaDataRenderer](README.md#metadatarenderer)
- [RawDataRenderer](README.md#rawdatarenderer)
- [renderSkuPicker](README.md#renderskupicker)
- [setup](README.md#setup)

## Type Aliases

### AdditionalDataRenderer

Ƭ **AdditionalDataRenderer**<`P`\>: (`props`: [`AdditionalDataRendererProps`](README.md#additionaldatarendererprops)<`P`\>) => `ReactNode`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | extends [`Product`](README.md#product) = [`Product`](README.md#product) |

#### Type declaration

▸ (`props`): `ReactNode`

##### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`AdditionalDataRendererProps`](README.md#additionaldatarendererprops)<`P`\> |

##### Returns

`ReactNode`

___

### AdditionalDataRendererProps

Ƭ **AdditionalDataRendererProps**<`P`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | extends [`Product`](README.md#product) = [`Product`](README.md#product) |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `product` | `P` |

___

### Config

Ƭ **Config**: `Record`<`string`, `unknown`\>

Object containing all information configured on the app configuration page.

___

### DeleteFn

Ƭ **DeleteFn**: (`index`: `number`) => `void`

#### Type declaration

▸ (`index`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `index` | `number` |

##### Returns

`void`

___

### DisabledPredicateFn

Ƭ **DisabledPredicateFn**: (`currentValue`: `string`[], `config`: [`Config`](README.md#config)) => `boolean`

#### Type declaration

▸ (`currentValue`, `config`): `boolean`

Function that should return true when the button should be disabled.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currentValue` | `string`[] | Currently selected skus |
| `config` | [`Config`](README.md#config) | App configuration |

##### Returns

`boolean`

true, if the button in the field location should be disabled. false, if the button should be enabled

___

### Integration

Ƭ **Integration**<`P`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | extends [`Product`](README.md#product) = [`Product`](README.md#product) |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `additionalDataRenderer?` | [`AdditionalDataRenderer`](README.md#additionaldatarenderer)<`P`\> | render additional data with for Product Card version "v2" |
| `color` | `string` | The app's primary color |
| `description` | `string` | Short description of the app |
| `fetchProductPreviews` | [`ProductPreviewsFn`](README.md#productpreviewsfn)<`P`\> | Function that returns a list for a given list of skus. The returned value is used to render a product preview. **`Param`** List of skus **`Param`** App configuration |
| `isDisabled` | [`DisabledPredicateFn`](README.md#disabledpredicatefn) | Function that should return true when the button should be disabled. **`Param`** Currently selected assets **`Param`** App configuration |
| `isInOrchestrationEAP?` | `boolean` | - |
| `logo` | `string` | Path to the app's logo |
| `makeCTA` | [`MakeCTAFn`](README.md#makectafn) | Returns the text that is displayed on the button in the field location. **`Param`** Type of the field the app is used for. |
| `name` | `string` | Name of the app |
| `openDialog` | [`OpenDialogFn`](README.md#opendialogfn) | Function that gets called when app wants to open a dialog. Should return an updated list of skus as a Promise. You probably want to call [`sdk.openCurrentApp`](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#open-the-current-app-in-a-dialog). **`Example`** ```javascript async function openDialog(sdk, currentValue, config) { return await sdk.dialogs.openCurrentApp({ parameters: { config, currentValue }, }); } ``` **`Param`** [FieldExtensionSDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/) **`Param`** Array of currently selected skus **`Param`** App configuration |
| `parameterDefinitions` | [`ParameterDefinition`](README.md#parameterdefinition)[] | Parameter definition which can be customized on the app configuration page and used in the callback functions. |
| `productCardVersion?` | [`ProductCardVersion`](README.md#productcardversion) | Opt-in to the new Product Card component |
| `renderDialog` | [`RenderDialogFn`](README.md#renderdialogfn) | Function that gets called within the Iframe when the app is rendered in a dialog location. **`Example`** ```javascript function renderDialog(sdk) { const config = sdk.parameters.invocation; const container = document.createElement('div'); container.innerHTML = `<iframe src="https://example.com/dam?folder=${config.folder}" width="400" height="650" style="border:none;"/>`; document.body.appendChild(container); } ``` **`Param`** [DialogExtensionSDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/) |
| `skuTypes?` | [`SKUType`](README.md#skutype)[] | If your app supports multiple sku types (for example - product, product variant, category...) you can provide a list here. This configuration will be stored under the skuTypes key in your installation parameters. |
| `validateParameters` | [`ValidateParametersFn`](README.md#validateparametersfn) | Custom code that validates installation parameters that is run before saving. **`Param`** Object containing the entered parameters. |

___

### MakeCTAFn

Ƭ **MakeCTAFn**: (`fieldType`: `string`, `skuType?`: `string`) => `string`

#### Type declaration

▸ (`fieldType`, `skuType?`): `string`

Returns the text that is displayed on the button in the field location.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fieldType` | `string` | Type of the field the app is used for. |
| `skuType?` | `string` | SKU type of the current field. Undefined if only a single SKU type is supported by the app. |

##### Returns

`string`

Text that should be displayed on the button

___

### MakeSaveBtnTextFn

Ƭ **MakeSaveBtnTextFn**: (`selectedSKUs`: `string`[], `skuType?`: `string`) => `string`

#### Type declaration

▸ (`selectedSKUs`, `skuType?`): `string`

Returns the text that is used for confirming the dialog selection.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `selectedSKUs` | `string`[] | An array of SKUs chosen. |
| `skuType?` | `string` | - |

##### Returns

`string`

Text that should be displayed on the button

___

### OpenDialogFn

Ƭ **OpenDialogFn**: (`sdk`: `FieldAppSDK`, `currentValue`: `string`[] \| `string`, `config`: [`Config`](README.md#config)) => `Promise`<`string`[]\>

#### Type declaration

▸ (`sdk`, `currentValue`, `config`): `Promise`<`string`[]\>

Function that gets called when app wants to open a dialog. Should return an updated list of skus as a Promise.

You probably want to call [`sdk.openCurrentApp`](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#open-the-current-app-in-a-dialog).

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sdk` | `FieldAppSDK` | [FieldExtensionSDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/) |
| `currentValue` | `string`[] \| `string` | List of currently selected akus |
| `config` | [`Config`](README.md#config) | App configuration |

##### Returns

`Promise`<`string`[]\>

Promise containing a list of selected skus

**`Example`**

```javascript
async function openDialog(sdk, currentValue, config) {
  return await sdk.dialogs.openCurrentApp({
    parameters: { config, currentValue },
  });
}

```

___

### Pagination

Ƭ **Pagination**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `count` | `number` |
| `hasNextPage?` | `boolean` |
| `limit` | `number` |
| `offset` | `number` |
| `total` | `number` |

___

### ParameterDefinition

Ƭ **ParameterDefinition**: `Object`

Definition of app configuration parameters

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `default?` | `unknown` | Default value |
| `description` | `string` | Short description/explanation |
| `id` | `string` | Unique id. Used as key in Config object. |
| `name` | `string` | Name / Label |
| `required` | `boolean` | Whether it is possible without providing a value. |
| `type` | ``"Symbol"`` \| ``"List"`` \| ``"Number"`` | Parameter type - Symbol: Text - List: List of texts - Number: Integer |

___

### Product

Ƭ **Product**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `category?` | `string` |
| `description?` | `string` |
| `displaySKU?` | `string` |
| `externalLink?` | `string` |
| `id` | `string` |
| `image` | `string` |
| `name` | `string` |
| `sku` | `string` |

___

### ProductCardVersion

Ƭ **ProductCardVersion**: ``"v1"`` \| ``"v2"``

___

### ProductPreviewsFn

Ƭ **ProductPreviewsFn**<`P`\>: (`skus`: `string`[], `config`: [`Config`](README.md#config), `skuType?`: `string`) => `Promise`<`P`[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | extends [`Product`](README.md#product) = [`Product`](README.md#product) |

#### Type declaration

▸ (`skus`, `config`, `skuType?`): `Promise`<`P`[]\>

Function that returns a list for a given list of skus. The returned value is used to render a product preview.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `skus` | `string`[] | List of skus |
| `config` | [`Config`](README.md#config) | App configuration |
| `skuType?` | `string` | SKU type of the current field. Undefined if only a single SKU type is supported by the app. |

##### Returns

`Promise`<`P`[]\>

List of Products which is used to render a preview.

___

### ProductsFn

Ƭ **ProductsFn**<`P`\>: (`search`: `string`, `pagination?`: `Partial`<[`Pagination`](README.md#pagination)\>) => `Promise`<`ProductsFnResponse`<`P`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | extends [`Product`](README.md#product) = [`Product`](README.md#product) |

#### Type declaration

▸ (`search`, `pagination?`): `Promise`<`ProductsFnResponse`<`P`\>\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `search` | `string` |
| `pagination?` | `Partial`<[`Pagination`](README.md#pagination)\> |

##### Returns

`Promise`<`ProductsFnResponse`<`P`\>\>

___

### RenderDialogFn

Ƭ **RenderDialogFn**: (`sdk`: `DialogAppSDK`) => `void`

#### Type declaration

▸ (`sdk`): `void`

Function that gets called within the Iframe when the app is rendered in a dialog location.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sdk` | `DialogAppSDK` | [DialogExtensionSDK](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/) |

##### Returns

`void`

**`Example`**

```javascript
function renderDialog(sdk) {
  const config = sdk.parameters.invocation;

  const container = document.createElement('div');
  container.innerHTML = `<iframe src="https://example.com/dam?folder=${config.folder}" width="400" height="650" style="border:none;"/>`;
  document.body.appendChild(container);
}
```

___

### SKUType

Ƭ **SKUType**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `default?` | `boolean` |
| `id` | `string` |
| `name` | `string` |

___

### ValidateParametersFn

Ƭ **ValidateParametersFn**: (`parameters`: `Record`<`string`, `string`\>) => `string` \| ``null``

#### Type declaration

▸ (`parameters`): `string` \| ``null``

Custom code that validates installation parameters that is run before saving.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `parameters` | `Record`<`string`, `string`\> | Object containg the entered parameters. |

##### Returns

`string` \| ``null``

`string` containing an error message. `null` if the parameters are valid.

## Functions

### LinkDataItemRenderer

▸ **LinkDataItemRenderer**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`Props`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

___

### MetaDataRenderer

▸ **MetaDataRenderer**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`MetaDataProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

___

### RawDataRenderer

▸ **RawDataRenderer**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`Props`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

___

### renderSkuPicker

▸ **renderSkuPicker**(`elementId`, `«destructured»`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `elementId` | `string` |
| `«destructured»` | `Props` |

#### Returns

`void`

___

### setup

▸ **setup**<`P`\>(`integration`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | extends [`Product`](README.md#product) = [`Product`](README.md#product) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `integration` | [`Integration`](README.md#integration)<`P`\> |

#### Returns

`void`
