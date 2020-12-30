[@contentful/dam-app-base](../README.md) / interfaces

# Module: interfaces

## Index

### Interfaces

* [Integration](../interfaces/interfaces.integration.md)
* [ParameterDefinition](../interfaces/interfaces.parameterdefinition.md)

### Type aliases

* [Asset](interfaces.md#asset)
* [Config](interfaces.md#config)
* [DeleteFn](interfaces.md#deletefn)
* [DisabledPredicateFn](interfaces.md#disabledpredicatefn)
* [OpenDialogFn](interfaces.md#opendialogfn)
* [RenderDialogFn](interfaces.md#renderdialogfn)
* [ThumbnailFn](interfaces.md#thumbnailfn)
* [ValidateParametersFn](interfaces.md#validateparametersfn)

## Type aliases

### Asset

Ƭ **Asset**: *Record*<*string*, *any*\>

Object containing data about the asset. Shape and values are DAM service specific.

___

### Config

Ƭ **Config**: *Record*<*string*, *any*\>

Object containing all information configured on the app configuration page.

___

### DeleteFn

Ƭ **DeleteFn**: (`index`: *number*) => *void*

___

### DisabledPredicateFn

Ƭ **DisabledPredicateFn**: (`currentValue`: [*Asset*](interfaces.md#asset)[], `config`: [*Config*](interfaces.md#config)) => *boolean*

Function that should return true when the button should be disabled.

**`param`** Currently selected assets

**`param`** App configuration

**`returns`** true, if the button in the field location should be disabled. false, if the button should be enabled

___

### OpenDialogFn

Ƭ **OpenDialogFn**: (`sdk`: FieldExtensionSDK, `currentValue`: [*Asset*](interfaces.md#asset)[], `config`: [*Config*](interfaces.md#config)) => *Promise*<[*Asset*](interfaces.md#asset)[]\>

Function that gets called when app wants to open a dialog. Should return an updated list of assets as a Promise.

You probably want to call [`sdk.openCurrentApp`](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#open-the-current-app-in-a-dialog).

**`example`** 
```javascript
function openDialog(sdk, currentValue, config) {
  return await sdk.dialogs.openCurrentApp({
    parameters: { config, currentValue },
  });
}

```

**`param`** (https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/)

**`param`** List of currently selected assets

**`param`** App configuration

**`returns`** Promise containing a list of selected assets

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

### ThumbnailFn

Ƭ **ThumbnailFn**: (`asset`: [*Asset*](interfaces.md#asset), `config`: [*Config*](interfaces.md#config)) => [*string*, *string* \| *undefined*]

Returns the url of the thumbnail of an asset.

**`param`** Asset

**`param`** App configuration

**`returns`** Tuple containing (1) the url and (2) the text represantation of the asset (optional)

___

### ValidateParametersFn

Ƭ **ValidateParametersFn**: (`parameters`: *Record*<*string*, *any*\>) => *string* \| *null*

Custom code that validates installation parameters that is run before saving.

**`param`** Object containg the entered parameters.

**`returns`** `string` containing an error message. `null` if the parameters are valid.
