import { useEffect, useState } from 'react';
import {
  EntryFieldAPI,
  FieldExtensionSDK,
  locations,
  SidebarExtensionSDK,
} from '@contentful/app-sdk';
import { Flex } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

import { NativeFieldEditorRender } from '../NativeFieldEditorRender';
import { WidgetRenderer } from '../WidgetRenderer';
import { FieldErrorErroBoundary } from './FieldErrorBoundary';
import { GeneralErrorBoundary } from './GeneralErroBoundary';
import { InvalidOrMissingWidgetsWarning } from './InvalidOrMissingWidgetsWarning';
import { WidgetElementDefinition } from '../../types';

interface EntryWidgetsProps {
  widgetsList?: WidgetElementDefinition[];
  canEditAppConfig: boolean;
}

function Widgets({
  widgetsList,
  sdk,
  entryData,
}: {
  widgetsList: EntryWidgetsProps['widgetsList'];
  sdk: FieldExtensionSDK | SidebarExtensionSDK;
  entryData: Record<string, any>;
}) {
  return (
    <>
      {widgetsList?.map((widget, widgetIndex) => (
        <WidgetRenderer
          key={widgetIndex}
          widgetDef={widget}
          entity={entryData}
          contentTypeId={sdk.contentType.sys.id}
        />
      ))}
    </>
  );
}

export const EntryWidgets = ({ widgetsList, canEditAppConfig }: EntryWidgetsProps) => {
  const sdk = useSDK<FieldExtensionSDK | SidebarExtensionSDK>();

  const resolveFieldValue = (fieldapi: EntryFieldAPI) => {
    const firstLocale = fieldapi.locales[0];
    return {
      value: fieldapi.getValue(firstLocale),
    };
  };

  const [entryData, setEntryData] = useState({
    sys: sdk.entry.getSys(),
    fields: Object.entries(sdk.entry.fields).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: resolveFieldValue(value),
      }),
      {}
    ),
    metadata: sdk.entry.getMetadata(),
    tasks: sdk.entry.getTasks(),
  });

  useEffect(() => {
    Object.entries(sdk.entry.fields).forEach(([key, field]) => {
      field.onValueChanged((newValue) => {
        setEntryData((prevState) => {
          return {
            ...prevState,
            fields: { ...prevState.fields, [key]: { value: newValue } },
          };
        });
      });
    });
  }, []);

  return (
    <GeneralErrorBoundary>
      <Flex flexDirection="column" gap="spacingS" alignItems="left">
        {sdk.location.is(locations.LOCATION_ENTRY_FIELD) ? (
          <FieldErrorErroBoundary contentTypeId={sdk.contentType.sys.id}>
            <Widgets sdk={sdk} widgetsList={widgetsList} entryData={entryData} />
          </FieldErrorErroBoundary>
        ) : (
          <Widgets sdk={sdk} widgetsList={widgetsList} entryData={entryData} />
        )}

        {!widgetsList && (
          <>
            {sdk.location.is(locations.LOCATION_ENTRY_FIELD) && (
              <NativeFieldEditorRender contentTypeId={sdk.contentType.sys.id} />
            )}
            <InvalidOrMissingWidgetsWarning
              openAppConfig={canEditAppConfig ? () => sdk.navigator.openAppConfig() : undefined}
              location={sdk.location.is(locations.LOCATION_ENTRY_FIELD) ? 'field' : 'sidebar'}
            />
          </>
        )}
      </Flex>
    </GeneralErrorBoundary>
  );
};
