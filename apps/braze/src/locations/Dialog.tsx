import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { assembleQuery, Field } from '../dialogaux';
import generateLiquidTags from '../helpers/generateLiquidTags';

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
  const liquidTag = generateLiquidTags(contentTypeId, invocationParams.entryFields[0]);

  return (
    <>
      <code>{query}</code>
      <code>{liquidTag}</code>
    </>
  );
};

export default Dialog;
