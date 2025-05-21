import React from 'react';
import {
  Heading,
  Flex,
  Paragraph,
  Note,
  TextLink,
  Checkbox,
  FormControl,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

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
  const sdk = useSDK();
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
              ? `https://${sdk.hostnames.webapp}/spaces/${space}/content_types`
              : `https://${sdk.hostnames.webapp}/spaces/${space}/environments/${environment}/content_types`
          }>
          content type
        </TextLink>{' '}
        and assign it to the app from this screen.
      </Note>
    );
  } else {
    contentToRender = (
      <Flex flexDirection="column" gap="spacingM">
        {sortedContentTypes.map((ct) => (
          <FormControl id={ct.name} key={ct.id} marginBottom="none">
            <Checkbox
              testId={`ct-item-${ct.id}`}
              name={ct.name}
              isChecked={selectedContentTypes.includes(ct.id)}
              onChange={() => selectCt(ct.id)}>
              {ct.name}
            </Checkbox>
          </FormControl>
        ))}
      </Flex>
    );
  }
  return (
    <>
      <Heading>Assign to content types</Heading>
      <Paragraph>Pick the content types where Jira will install to the sidebar.</Paragraph>
      <div className="content-types-config" data-test-id="content-types">
        {contentToRender}
      </div>
    </>
  );
};

export default ContentTypeStep;
