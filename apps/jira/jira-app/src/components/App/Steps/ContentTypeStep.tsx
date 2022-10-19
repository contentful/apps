import React from 'react';
import { FieldGroup } from '@contentful/forma-36-react-components';

import { Checkbox, Note, TextLink, Heading, Paragraph } from '@contentful/f36-components';

interface Props {
  space: string;
  environment: string;
  selectCt: (id: string) => void;
  selectedContentTypes: string[];
  contentTypes: { name: string; id: string }[];
}

const ContentTypeStep = ({
  contentTypes,
  selectCt,
  selectedContentTypes,
  space,
  environment,
}: Props) => {
  const ctMap: { [key: string]: string } = contentTypes.reduce((acc, ct) => {
    return {
      ...acc,
      ...{ [ct.name]: ct.id },
    };
  }, {});

  const sortedContentTypes = Object.keys(ctMap)
    .sort()
    .map((ctName) => ({
      name: ctName,
      id: ctMap[ctName],
    }));

  let contentToRender;
  if (sortedContentTypes.length === 0) {
    contentToRender = (
      <Note variant="warning">
        There are <strong>no content types</strong> in this environment. You can add a{' '}
        <TextLink
          variant="primary"
          target="_blank"
          rel="noopener noreferrer"
          href={
            environment === 'master'
              ? `https://app.contentful.com/spaces/${space}/content_types`
              : `https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`
          }
        >
          content type
        </TextLink>{' '}
        and assign it to the app from this screen.
      </Note>
    );
  } else {
    contentToRender = (
      <FieldGroup>
        {sortedContentTypes.map((ct) => (
          <Checkbox
            id={ct.name}
            name={ct.name}
            value={ct.id}
            isChecked={selectedContentTypes.includes(ct.id)}
            onChange={() => selectCt(ct.id)}
          >
            {ct.name}
          </Checkbox>
        ))}
      </FieldGroup>
    );
  }
  return (
    <React.Fragment>
      <Heading>Assign to content types</Heading>
      <Paragraph>Pick the content types where Jira will install to the sidebar.</Paragraph>
      <div className="content-types-config" data-test-id="content-types">
        {contentToRender}
      </div>
    </React.Fragment>
  );
};

export default ContentTypeStep;
