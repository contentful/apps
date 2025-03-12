import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  generateConnectedContentCall,
  Field,
  assembleQuery,
  getGraphQLResponse,
} from '../helpers/assembleQuery';
import generateLiquidTags from '../helpers/generateLiquidTags';

import { Heading, List, ListItem } from '@contentful/f36-components';
import { useEffect, useState } from 'react';

export type InvocationParams = {
  entryId: string;
  entryFields: Field[];
  contentTypeId: string;
};

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const [graphqlResponse, setGraphqlResponse] = useState<string>();

  const spaceId = sdk.ids.space;
  const token = sdk.parameters.installation.apiKey;
  const invocationParams = sdk.parameters.invocation as InvocationParams;
  const contentTypeId = invocationParams.contentTypeId;
  const entryId = invocationParams.entryId;
  const query = assembleQuery(contentTypeId, entryId, invocationParams.entryFields);
  const connectedContentCall = generateConnectedContentCall(query, spaceId, token);
  const liquidTags = generateLiquidTags(contentTypeId, invocationParams.entryFields);
  useEffect(() => {
    const fetchEntry = async () => {
      const response = await getGraphQLResponse(spaceId, token, query);
      setGraphqlResponse(JSON.stringify(response));
    };
    fetchEntry();
  }, []);

  return (
    <>
      <Heading marginBottom="spacingS">Braze Connected Content Call</Heading>
      <code>{connectedContentCall}</code>
      <Heading marginBottom="spacingS">
        Liquid tag to reference selected Contentful fields, within Braze message body
      </Heading>
      <List>
        {liquidTags.map((liquidTag) => (
          <ListItem key={liquidTag}>
            <code>{liquidTag}</code>
          </ListItem>
        ))}
      </List>
      <Heading marginBottom="spacingS">
        JSON data available in Braze via Connected Content call
      </Heading>
      <code>{graphqlResponse}</code>
    </>
  );
};

export default Dialog;
