import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useMemo, useState } from 'react';
import { EntryWidgets } from '../components/EntryWidgets';
import { WidgetElementDefinition } from '../types';
import { WidgetRenderedEvent } from '../analytics/events/WidgetRenderedEvent';

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>();
  useAutoResizer();

  const [canEditAppConfig, setCanEditAppConfig] = useState(false);
  useEffect(() => {
    sdk.access.canEditAppConfig().then((can) => setCanEditAppConfig(can));
  }, []);

  const serializedWidgets: WidgetElementDefinition[] | undefined = useMemo(() => {
    try {
      let parameters = sdk.parameters.installation;

      const locationDef = parameters.defs[sdk.contentType.sys.id].sidebar;
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

  useEffect(() => {
    const widgets = serializedWidgets?.map((widget) => widget.type);

    WidgetRenderedEvent(widgets, 'Sidebar');
  }, [serializedWidgets]);

  return <EntryWidgets widgetsList={serializedWidgets} canEditAppConfig={canEditAppConfig} />;
};

export default Sidebar;
