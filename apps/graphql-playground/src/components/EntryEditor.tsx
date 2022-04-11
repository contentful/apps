import React from "react";
import { Note } from "@contentful/forma-36-react-components";
import { EditorExtensionSDK } from "contentful-ui-extensions-sdk";

interface EditorProps {
  sdk: EditorExtensionSDK;
}

const Entry = (props: EditorProps) => {
  return (
    <Note noteType="warning" style={{ margin: "1em" }}>
      GraphQL playground is not supported in the Entry editor location.
    </Note>
  );
};

export default Entry;
