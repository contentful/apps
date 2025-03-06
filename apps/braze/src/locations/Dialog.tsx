import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { assembleQuery, Field } from '../dialogaux';
import generateLiquidTags from '../helpers/generateLiquidTags';

import { Heading, List, ListItem } from '@contentful/f36-components';

export type InvocationParams = {
  entryId: string;
  entryFields: Field[];
  contentTypeId: string;
};

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();

  const spaceId = sdk.ids.space;
  const token = sdk.parameters.installation.apiKey;
  const invocationParams = sdk.parameters.invocation as InvocationParams;
  const contentTypeId = invocationParams.contentTypeId;
  const entryId = invocationParams.entryId;
  const query = assembleQuery(contentTypeId, entryId, invocationParams.entryFields, spaceId, token);
  const liquidTags = generateLiquidTags(contentTypeId, invocationParams.entryFields);

  return (
    <>
      <Heading marginBottom="spacingS">Content Call:</Heading>
      <code>{query}</code>
      <Heading marginBottom="spacingS">Liquid Tags:</Heading>
      <List>
        {liquidTags.map((liquidTag) => (
          <ListItem key={liquidTag}>
            <code>{liquidTag}</code>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default Dialog;
