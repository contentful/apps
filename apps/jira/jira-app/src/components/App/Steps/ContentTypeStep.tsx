import React from 'react';
import {
  Typography,
  Heading,
  FieldGroup,
  CheckboxField,
  Paragraph,
  Note,
  TextLink
} from '@contentful/forma-36-react-components';

interface Props {
  space: string;
  environment: string;
  selectCt: (id: string) => void;
  selectedContentTypes: string[];
  contentTypes: { name: string; id: string }[];
}

const ContentTypeStep = ({ contentTypes, selectCt, selectedContentTypes, space, environment }: Props) => {
  const ctMap: { [key: string]: string } = contentTypes.reduce((acc, ct) => {
    return {
      ...acc,
      ...{ [ct.name]: ct.id }
    };
  }, {});

  const sortedContentTypes = Object.keys(ctMap)
    .sort()
    .map(ctName => ({
      name: ctName,
      id: ctMap[ctName]
    }));

  let contentToRender;
  if (sortedContentTypes.length === 0) {
    contentToRender = (
      <Note noteType="warning">
        There are <strong>no content types</strong> in this environment. You can add a{' '}
        <TextLink
          linkType="primary"
          target="_blank"
          rel="noopener noreferrer"
          href={
            environment === 'master'
              ? `https://app.contentful.com/spaces/${space}/content_types`
              : `https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`
          }>
          content type
        </TextLink>{' '}
        and assign it to the app from this screen.
      </Note>
    );
  } else {
    contentToRender = (
      <FieldGroup>
        {sortedContentTypes.map(ct => (
          <CheckboxField
            onChange={() => selectCt(ct.id)}
            labelText={ct.name}
            name={ct.name}
            checked={selectedContentTypes.includes(ct.id)}
            value={ct.id}
            id={ct.name}
            key={ct.id}
            data-test-id={`ct-item-${ct.id}`}
          />
        ))}
      </FieldGroup>
    );
  }
  return (
    <Typography>
      <Heading>Assign to content types</Heading>
      <Paragraph>Pick the content types where Jira will install to the sidebar.</Paragraph>
      <div className="content-types-config" data-test-id="content-types">
        {contentToRender}
      </div>
    </Typography>
  );
};

export default ContentTypeStep
