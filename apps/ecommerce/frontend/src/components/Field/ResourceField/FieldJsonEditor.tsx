import { Field } from '@contentful/default-field-editors';
import { Collapse, TextLink } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { FieldAppSDK } from '@contentful/app-sdk';
import { useState } from 'react';

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
