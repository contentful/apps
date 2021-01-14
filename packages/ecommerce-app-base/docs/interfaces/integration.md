[@contentful/ecommerce-app-base](../README.md) / Integration

# Interface: Integration

## Hierarchy

* **Integration**

## Index

### Properties

* [color](integration.md#color)
* [description](integration.md#description)
* [fetchProductPreviews](integration.md#fetchproductpreviews)
* [isDisabled](integration.md#isdisabled)
* [logo](integration.md#logo)
* [makeCTA](integration.md#makecta)
* [name](integration.md#name)
* [openDialog](integration.md#opendialog)
* [parameterDefinitions](integration.md#parameterdefinitions)
* [renderDialog](integration.md#renderdialog)
* [validateParameters](integration.md#validateparameters)

## Properties

### color

• **color**: *string*

The app's primary color

___

### description

• **description**: *string*

Short description of the app

___

### fetchProductPreviews

• **fetchProductPreviews**: [*ProductPreviewsFn*](../README.md#productpreviewsfn)

Function that returns a list for a given list of skus. The returned value is used to render a product preview.

**`param`** List of skus

**`param`** App configuration

**`returns`** List of Products which is used to render a preview.

___

### isDisabled

• **isDisabled**: [*DisabledPredicateFn*](../README.md#disabledpredicatefn)

Function that should return true when the button should be disabled.

**`param`** Currently selected assets

**`param`** App configuration

**`returns`** true, if the button in the field location should be disabled. false, if the button should be enabled

___

### logo

• **logo**: *string*

Path to the app's logo

___

### makeCTA

• **makeCTA**: [*MakeCTAFn*](../README.md#makectafn)

Returns the text that is displayed on the button in the field location.

**`param`** Type of the field the app is used for.

**`returns`** Text that should be displayed on the button

___

### name

• **name**: *string*

Name of the app

___

### openDialog

• **openDialog**: [*OpenDialogFn*](../README.md#opendialogfn)

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

**`param`** Array of currently selected skus

**`param`** App configuration

**`returns`** Promise containing a list of selected assets

___

### parameterDefinitions

• **parameterDefinitions**: [*ParameterDefinition*](parameterdefinition.md)[]

Parameter definition which can be customized on the app configuration page and used in the callback functions.

___

### renderDialog

• **renderDialog**: [*RenderDialogFn*](../README.md#renderdialogfn)

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

### validateParameters

• **validateParameters**: [*ValidateParametersFn*](../README.md#validateparametersfn)

Custom code that validates installation parameters that is run before saving.

**`param`** Object containg the entered parameters.

**`returns`** `string` containing an error message. `null` if the parameters are valid.
