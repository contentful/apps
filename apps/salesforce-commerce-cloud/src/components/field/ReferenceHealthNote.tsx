import React from 'react';
import { Box, Note } from '@contentful/f36-components';

import { getItemStatus, labelFor } from '../../utils/resources';
import { useFieldItems } from '../../utils/useFieldItems';

/**
 * Summarises references that no longer resolve or that the storefront would not render,
 * so editors notice broken links before publishing.
 */
const ReferenceHealthNote = (props: { value: string | string[] }) => {
  const keys = Array.isArray(props.value) ? props.value : [props.value];
  const { fieldType, queries } = useFieldItems(keys);

  if (!queries.every((query) => query.isSuccess || query.isError)) return null;

  const missing = queries.filter((query) => query.isError).length;
  const flagged = queries.filter(
    (query) => query.isSuccess && getItemStatus(fieldType, query.data).length > 0
  ).length;

  if (!missing && !flagged) return null;

  const label = labelFor(fieldType);
  const noun = (count: number) => (count === 1 ? label.singular : label.plural);
  const messages = [
    missing ? `${missing} ${noun(missing)} could not be found in Salesforce Commerce Cloud.` : '',
    flagged ? `${flagged} ${noun(flagged)} may not display on the storefront.` : '',
  ].filter(Boolean);

  return (
    <Box marginBottom="spacingS">
      <Note variant={missing ? 'negative' : 'warning'} title="Check referenced items">
        {messages.join(' ')}
      </Note>
    </Box>
  );
};

export default ReferenceHealthNote;
