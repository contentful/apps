import * as React from "react";
import { Heading, Paragraph } from "@contentful/forma-36-react-components";

interface Props {
  contentTypesFound: boolean;
}

export const FieldTypeInstructions = ({ contentTypesFound }: Props) => (
  <>
    <Heading>Assign to fields</Heading>
    {contentTypesFound ? (
      <Paragraph>
        This app can only be used with <strong>Short text</strong> or{" "}
        <strong>Short text, list</strong> fields. Select which fields you’d like
        to enable for this app.
      </Paragraph>
    ) : (
      <>
        <Paragraph>
          This app can only be used with <strong>Short text</strong> or{" "}
          <strong>Short text, list</strong> fields.
        </Paragraph>
        <Paragraph>
          There are{" "}
          <strong>no content types with Short text or Short text, list</strong>{" "}
          fields in this environment. You can add one here later.
        </Paragraph>
      </>
    )}
  </>
);
