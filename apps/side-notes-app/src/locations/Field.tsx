import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useMemo, useState } from 'react';
import { EntryWidgets } from '../components/EntryWidgets';
import { WidgetElementDefinition } from '../types';

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  useAutoResizer({ absoluteElements: true });

  const [canEditAppConfig, setCanEditAppConfig] = useState(false);
  useEffect(() => {
    sdk.access.canEditAppConfig().then((can) => setCanEditAppConfig(can));
  }, []);

  const serializedWidgets: WidgetElementDefinition[] = useMemo(() => {
    try {
      const parameters = sdk.parameters.installation;

      const locationDef = parameters.defs[sdk.contentType.sys.id].fields[sdk.field.id];
      const widgets = locationDef.widgets;

      // possible old configuration, can be removed at some point
      if (typeof widgets === 'string') {
        return JSON.parse(widgets);
      }
      return widgets;
    } catch {
      return undefined;
    }
  }, [sdk.parameters.installation]);

  return <EntryWidgets widgetsList={serializedWidgets} canEditAppConfig={canEditAppConfig} />;
};

export default Field;
