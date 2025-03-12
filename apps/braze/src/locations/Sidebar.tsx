import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { transformEntryFields } from '../helpers/transformEntryFields';
import { InvocationParams } from './Dialog';
import { useEffect, useState } from 'react';
import { createClient } from 'contentful-management';
import { Field } from '../helpers/assembleQuery';
import resolveResponse from 'contentful-resolve-response';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const [entryFields, setEntryFields] = useState<Field[]>([]);
  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );
  useEffect(() => {
    const fetchEntry = async () => {
      const response = await cma.entry.references({ entryId: sdk.ids.entry, include: 5 });
      const items = resolveResponse(response);
      const fields = await transformEntryFields(items[0], cma);
      setEntryFields(fields);
    };
    fetchEntry();
  }, []);

  const invocationParams: InvocationParams = {
    entryId: sdk.ids.entry,
    entryFields: entryFields,
    contentTypeId: sdk.ids.contentType,
  };

  return (
    <Button
      // isDisabled={entryFields.length === 0} // TODO: isLoading doesn't seem to disable the button
      isLoading={entryFields.length === 0}
      variant="primary"
      isFullWidth={true}
      onClick={async () => {
        sdk.dialogs.openCurrentApp({
          title: 'Generate Braze Connected Content Call',
          parameters: invocationParams,
        });
      }}>
      Generate Braze Connected Content
    </Button>
  );
};

export default Sidebar;
