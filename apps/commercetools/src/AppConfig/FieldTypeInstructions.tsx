import * as React from 'react';
import { Heading, Paragraph } from '@contentful/forma-36-react-components';

interface Props {
  contentTypesFound: boolean;
}

export const FieldTypeInstructions = ({ contentTypesFound }: Props) => (
  <>
    <Heading>Assign to fields</Heading>
    {contentTypesFound ? (
      <Paragraph>
        This app can only be used with <strong>Short text</strong> fields. Select which fields you’d
        like to enable for this app.
      </Paragraph>
    ) : (
      <>
        <Paragraph>
          This app can only be used with <strong>Short text</strong> fields.
        </Paragraph>
        <Paragraph>
          There are <strong>no content types with Short text</strong> fields in this environment.
          You can add one here later.
        </Paragraph>
      </>
    )}
  </>
);
