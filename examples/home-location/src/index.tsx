import React from "react";
import { render } from "react-dom";
import { init, KnownSDK } from "@contentful/app-sdk";
import { GlobalStyles } from "@contentful/f36-components";

import LocalhostWarning from "./components/LocalhostWarning";
import App from "./App";
import { SDKProvider } from "./SDKProvider";

const root = document.getElementById("root");

window.addEventListener("message", (e) => {
  console.log(e.data);
});

init((sdk: KnownSDK) => {
  if (process.env.NODE_ENV === "development" && window.self === window.top) {
    // You can remove this if block before deploying your app
    render(<LocalhostWarning />, root);
  } else {
    render(
      <SDKProvider>
        <GlobalStyles />
        <App />
      </SDKProvider>,
      root
    );
  }
});
