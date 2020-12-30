[@contentful/dam-app-base](../README.md) / utils

# Module: utils

## Index

### Interfaces

* [ContentType](../interfaces/utils.contenttype.md)
* [EditorInterface](../interfaces/utils.editorinterface.md)
* [Field](../interfaces/utils.field.md)

### Type aliases

* [CompatibleFields](utils.md#compatiblefields)
* [SelectedFields](utils.md#selectedfields)

### Functions

* [editorInterfacesToSelectedFields](utils.md#editorinterfacestoselectedfields)
* [getCompatibleFields](utils.md#getcompatiblefields)
* [selectedFieldsToTargetState](utils.md#selectedfieldstotargetstate)

## Type aliases

### CompatibleFields

Ƭ **CompatibleFields**: *Record*<*string*, [*Field*](../interfaces/utils.field.md)[]\>

___

### SelectedFields

Ƭ **SelectedFields**: *Record*<*string*, *string*[] \| *undefined*\>

## Functions

### editorInterfacesToSelectedFields

▸ **editorInterfacesToSelectedFields**(`eis`: [*EditorInterface*](../interfaces/utils.editorinterface.md)[], `appId?`: *string*): *Record*<*string*, *undefined* \| *string*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`eis` | [*EditorInterface*](../interfaces/utils.editorinterface.md)[] |
`appId?` | *string* |

**Returns:** *Record*<*string*, *undefined* \| *string*[]\>

___

### getCompatibleFields

▸ **getCompatibleFields**(`contentTypes`: [*ContentType*](../interfaces/utils.contenttype.md)[]): *Record*<*string*, [*Field*](../interfaces/utils.field.md)[]\>

#### Parameters:

Name | Type |
------ | ------ |
`contentTypes` | [*ContentType*](../interfaces/utils.contenttype.md)[] |

**Returns:** *Record*<*string*, [*Field*](../interfaces/utils.field.md)[]\>

___

### selectedFieldsToTargetState

▸ **selectedFieldsToTargetState**(`contentTypes`: [*ContentType*](../interfaces/utils.contenttype.md)[], `selectedFields`: *Record*<*string*, *undefined* \| *string*[]\>): object

#### Parameters:

Name | Type |
------ | ------ |
`contentTypes` | [*ContentType*](../interfaces/utils.contenttype.md)[] |
`selectedFields` | *Record*<*string*, *undefined* \| *string*[]\> |

**Returns:** object

Name | Type |
------ | ------ |
`EditorInterface` | {} |
