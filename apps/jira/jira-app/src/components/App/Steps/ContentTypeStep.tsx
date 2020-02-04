import React from 'react';
import {
  Typography,
  Heading,
  FieldGroup,
  CheckboxField,
  Paragraph
} from '@contentful/forma-36-react-components';

interface Props {
  selectCt: (id: string) => void;
  selectedContentTypes: string[];
  contentTypes: { name: string; id: string }[];
}

export default ({ contentTypes, selectCt, selectedContentTypes }: Props) => {
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

  return (
    <Typography>
      <Heading>Assign to content types</Heading>
      <Paragraph>Pick the content types where Jira will install to the sidebar.</Paragraph>
      <div className="content-types-config" data-test-id="content-types">
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
      </div>
    </Typography>
  );
};
