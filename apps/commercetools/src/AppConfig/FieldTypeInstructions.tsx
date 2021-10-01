import * as React from 'react';
import { Heading, Paragraph, TextLink } from '@contentful/forma-36-react-components';

interface Props {
  contentTypesFound: boolean;
  space: string;
  environment: string;
}

export const FieldTypeInstructions = ({ contentTypesFound, space, environment }: Props) => (
  <>
    <Heading>Assign to fields</Heading>
    {contentTypesFound ? (
      <Paragraph>
        This app can only be used with <strong>Short text</strong> or{' '}
        <strong>Short text, list</strong> fields. Select which fields you’d like to enable for
        this app.
      </Paragraph>
    ) : (
      <>
        <Paragraph>
          This app can only be used with <strong>Short text</strong> or{' '}
          <strong>Short text, list</strong> fields.
        </Paragraph>
        <Paragraph>
          There are <strong>no content types with Short text or Short text, list</strong>{' '}
          fields in this environment. You can add one in your{' '}
          <TextLink
            linkType="primary"
            target="_blank"
            href={
              environment === 'master'
                ? `https://app.contentful.com/spaces/${space}/content_types`
                : `https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`
            }>
            content model
          </TextLink>{' '}
          and assign it to the app from this screen.
        </Paragraph>
      </>
    )}
  </>
);
