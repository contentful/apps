import React from "react";
import { DialogExtensionSDK } from "contentful-ui-extensions-sdk";
import GqlPlayground from "./GqlPlayground";
import { Button } from "@contentful/forma-36-react-components";

interface DialogProps {
  sdk: DialogExtensionSDK;
}

const Dialog = (props: DialogProps) => {
  const { sdk } = props;
  const { parameters } = sdk;

  // @ts-ignore
  const entry = parameters?.invocation?.entry;
  // @ts-ignore
  const cpaToken = parameters?.installation?.cpaToken;
  const spaceId = sdk.ids.space;
  const spaceEnvironment = sdk.ids.environment;
  const spaceEnvironmentAlias = sdk.ids.environmentAlias;

  sdk.window.updateHeight(800);
  document.addEventListener("keydown", (event) => {
    if (event.keyCode === 27) {
      sdk.close();
    }
  });

  return (
    <>
      <Button
        buttonType="primary"
        className="dialogCloseBtn"
        icon="Close"
        onClick={() => sdk.close()}
        size="small"
        type="button"
        style={{ position: "absolute", top: "1em", right: "4em", zIndex: 1 }}
      >
        Close{" "}
      </Button>
      <GqlPlayground {...{ entry, cpaToken, spaceId, spaceEnvironment, spaceEnvironmentAlias }} />;
    </>
  );
};

export default Dialog;
