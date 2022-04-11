import React from "react";
import { Paragraph, Button, Note } from "@contentful/forma-36-react-components";
import { SidebarExtensionSDK } from "contentful-ui-extensions-sdk";

interface SidebarProps {
  sdk: SidebarExtensionSDK;
}

const Sidebar = (props: SidebarProps) => {
  const { sdk } = props;
  // @ts-ignore
  const cpaToken = sdk?.parameters?.installation?.cpaToken;

  sdk.window.startAutoResizer();
  const openGQLPlayground = () =>
    sdk.dialogs.openCurrentApp({
      width: "fullWidth",
      minHeight: "800px",
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: {
        entry: sdk.entry.getSys(),
      },
    });

  return cpaToken ? (
    <Paragraph>
      <Button onClick={openGQLPlayground} style={{ width: "100%" }}>
        Open GQL Playground
      </Button>
    </Paragraph>
  ) : (
    <Note noteType="warning">
      To use GraphQL playground. Please define the CPA installation parameter in
      your app configuration.
    </Note>
  );
};

export default Sidebar;
