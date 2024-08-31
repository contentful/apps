## stateful-sidebar-with-dialog

This app demonstrates how to share a state between two locations, in this case the Sidebar and the Dialog. It could also work between an Entry Editor (or a Field Editor) and a Dialog.

The state contains just a timestamp. Both Sidebar and Dialog contain a button "SET TIME" that updates the timestamp.

### Cannot truly whare state between Contentful App locations

The first important thing to note is that it is NOT really possible to truly share a React state between two app locations. In a standard React application, this could be achieved by:
- wrapping both components with a Provider that creates a state + a dispatcher by invoking the useReducer hook
- retrieving the state and the dispatcher inside both components by invoking the hook created by the Provider

However, Contentful Apps run inside distinct iframes; this means that, in the setup just described, the states and dispatchers created in the two location components would be distinct instances.

### The solution involves serializing the Sidebar state and deserializing it inside the Dialog

Since [sdk.dialogs.openCurrentApp](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#open-the-current-app-in-a-dialog) allows only to pass string parameters (this is actually a limitation due to the underlying [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)), the Sidebar state must be serialized with JSON.stringify().

The Dialog receives the serialized Sidebar state, istantiates its own state with a useReducer hook and fills it immediately by deserializing the Sidebar state with JSON.parse() inside a useEffect.

The Dialog operates then as desired, modifying its state normally through its React dispatcher.

When the Dialog closes, it passes back a serialized copy of its current state - once more prepared with JSON.stringify() - to the Sidebar; the latter refills again its whole state with JSON.parse().

It may be observed that while the timestamp gets updated in the Dialog by clicking on its button SET TIME, the timestamp in the Sidebar remains unchanged; when the Dialog closes, the Sidebar timestamp records the last Dialog value.