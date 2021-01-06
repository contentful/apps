[@contentful/dam-app-base](../README.md) / [interfaces](../modules/interfaces.md) / Integration

# Interface: Integration

## Hierarchy

* **Integration**

## Index

### Properties

* [color](interfaces.integration.md#color)
* [cta](interfaces.integration.md#cta)
* [description](interfaces.integration.md#description)
* [isDisabled](interfaces.integration.md#isdisabled)
* [logo](interfaces.integration.md#logo)
* [makeThumbnail](interfaces.integration.md#makethumbnail)
* [name](interfaces.integration.md#name)
* [openDialog](interfaces.integration.md#opendialog)
* [parameterDefinitions](interfaces.integration.md#parameterdefinitions)
* [renderDialog](interfaces.integration.md#renderdialog)
* [validateParameters](interfaces.integration.md#validateparameters)

## Properties

### color

• **color**: *string*

The app's primary color

___

### cta

• **cta**: *string*

Text on the button that is displayed in the field location

___

### description

• **description**: *string*

Short description of the app

___

### isDisabled

• **isDisabled**: [*DisabledPredicateFn*](../modules/interfaces.md#disabledpredicatefn)

Function that should return true when the button should be disabled.

**`param`** Currently selected assets

**`param`** App configuration

**`returns`** true, if the button in the field location should be disabled. false, if the button should be enabled

___

### logo

• **logo**: *string*

Path to the app's logo

___

### makeThumbnail

• **makeThumbnail**: [*ThumbnailFn*](../modules/interfaces.md#thumbnailfn)

Returns the url of the thumbnail of an asset.

**`param`** Asset

**`param`** App configuration

**`returns`** Tuple containing (1) the url and (2) the text represantation of the asset (optional)

___

### name

• **name**: *string*

Name of the app

___

### openDialog

• **openDialog**: [*OpenDialogFn*](../modules/interfaces.md#opendialogfn)

Function that gets called when app wants to open a dialog. Should return an updated list of assets as a Promise.

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

**`param`** List of currently selected assets

**`param`** App configuration

**`returns`** Promise containing a list of selected assets

___

### parameterDefinitions

• **parameterDefinitions**: [*ParameterDefinition*](interfaces.parameterdefinition.md)[]

Parameter definition which can be customized on the app configuration page and used in the callback functions.

___

### renderDialog

• **renderDialog**: [*RenderDialogFn*](../modules/interfaces.md#renderdialogfn)

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

• **validateParameters**: [*ValidateParametersFn*](../modules/interfaces.md#validateparametersfn)

Custom code that validates installation parameters that is run before saving.

**`param`** Object containg the entered parameters.

**`returns`** `string` containing an error message. `null` if the parameters are valid.
