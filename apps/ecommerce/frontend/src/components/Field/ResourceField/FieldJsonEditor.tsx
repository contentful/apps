import { Collapse, TextLink } from '@contentful/f36-components';
import { Field } from '@contentful/default-field-editors';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import type { FieldAppSDK } from '@contentful/app-sdk';

const FieldJsonEditor = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <>
      <TextLink as="button" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Hide' : 'Show'} JSON
      </TextLink>
      <Collapse isExpanded={isExpanded}>
        <Field sdk={sdk} />
      </Collapse>
    </>
  );
};

export default FieldJsonEditor;
