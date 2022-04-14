import React from "react";
import { Note } from "@contentful/forma-36-react-components";
import { FieldExtensionSDK } from "contentful-ui-extensions-sdk";

interface FieldProps {
  sdk: FieldExtensionSDK;
}

const Field = (prop: FieldProps) => {
  return (
    <Note noteType="warning" style={{ margin: "1em" }}>
      GraphQL playground is not supported in the Entry field location.
    </Note>
  );
};

export default Field;
