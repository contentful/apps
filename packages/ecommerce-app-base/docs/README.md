@contentful/ecommerce-app-base

# @contentful/ecommerce-app-base

## Index

### Interfaces

* [Integration](interfaces/integration.md)
* [Pagination](interfaces/pagination.md)
* [ParameterDefinition](interfaces/parameterdefinition.md)
* [Product](interfaces/product.md)

### Type aliases

* [Config](README.md#config)
* [DeleteFn](README.md#deletefn)
* [DisabledPredicateFn](README.md#disabledpredicatefn)
* [MakeCTAFn](README.md#makectafn)
* [OpenDialogFn](README.md#opendialogfn)
* [ProductPreviewsFn](README.md#productpreviewsfn)
* [ProductsFn](README.md#productsfn)
* [RenderDialogFn](README.md#renderdialogfn)
* [ValidateParametersFn](README.md#validateparametersfn)

### Functions

* [renderSkuPicker](README.md#renderskupicker)
* [setup](README.md#setup)

## Type aliases

### Config

Ƭ **Config**: *Record*<*string*, *any*\>

Object containing all information configured on the app configuration page.

___

### DeleteFn

Ƭ **DeleteFn**: (`index`: *number*) => *void*

___

### DisabledPredicateFn

Ƭ **DisabledPredicateFn**: (`currentValue`: *string*[], `config`: [*Config*](README.md#config)) => *boolean*

Function that should return true when the button should be disabled.

**`param`** Currently selected skus

**`param`** App configuration

**`returns`** true, if the button in the field location should be disabled. false, if the button should be enabled

___

### MakeCTAFn

Ƭ **MakeCTAFn**: (`fieldType`: *string*) => *string*

Returns the text that is displayed on the button in the field location.

**`param`** Type of the field the app is used for.

**`returns`** Text that should be displayed on the button

___

### OpenDialogFn

Ƭ **OpenDialogFn**: (`sdk`: FieldExtensionSDK, `currentValue`: *string*[] \| *string*, `config`: [*Config*](README.md#config)) => *Promise*<*string*[]\>

Function that gets called when app wants to open a dialog. Should return an updated list of skus as a Promise.

You probably want to call [`sdk.openCurrentApp`](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#open-the-current-app-in-a-dialog).

**`example`** 
```javascript
async function openDialog(sdk, currentValue, config) {
  return await sdk.dialogs.openCurrentApp({
    parameters: { config, currentValue },
  });
}

```

**`param`** (https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/)

**`param`** List of currently selected akus

**`param`** App configuration

**`returns`** Promise containing a list of selected skus

___

### ProductPreviewsFn

Ƭ **ProductPreviewsFn**: (`skus`: *string*[], `config`: [*Config*](README.md#config)) => *Promise*<[*Product*](interfaces/product.md)[]\>

Function that returns a list for a given list of skus. The returned value is used to render a product preview.

**`param`** List of skus

**`param`** App configuration

**`returns`** List of Products which is used to render a preview.

___

### ProductsFn

Ƭ **ProductsFn**: (`search`: *string*, `pagination?`: *Partial*<[*Pagination*](interfaces/pagination.md)\>) => *Promise*<ProductsFnResponse\>

___

### RenderDialogFn

Ƭ **RenderDialogFn**: (`sdk`: DialogExtensionSDK) => *void*

Function that gets called within the Iframe when the app is rendered in a dialog location.

**`example`** 
```javascript
function renderDialog(sdk) {
  const config = sdk.parameters.invocation;

  const container = document.createElement('div');
  container.innerHTML = `<iframe src="https://example.com/dam?folder=${config.folder}" width="400" height="650" style="border:none;"/>`;
  document.body.appendChild(container);
}
```

**`param`** (https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/)

___

### ValidateParametersFn

Ƭ **ValidateParametersFn**: (`parameters`: *Record*<*string*, *string*\>) => *string* \| *null*

Custom code that validates installation parameters that is run before saving.

**`param`** Object containg the entered parameters.

**`returns`** `string` containing an error message. `null` if the parameters are valid.

## Functions

### renderSkuPicker

▸ **renderSkuPicker**(`elementId`: *string*, `__namedParameters`: Props): *void*

#### Parameters:

Name | Type |
------ | ------ |
`elementId` | *string* |
`__namedParameters` | Props |

**Returns:** *void*

___

### setup

▸ **setup**(`integration`: [*Integration*](interfaces/integration.md)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`integration` | [*Integration*](interfaces/integration.md) |

**Returns:** *void*
