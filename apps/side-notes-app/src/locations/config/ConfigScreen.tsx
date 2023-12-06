import { AppExtensionSDK } from '@contentful/app-sdk';

import { useSDK } from '@contentful/react-apps-toolkit';
import { Route, Routes } from 'react-router-dom';

import tokens from '@contentful/f36-tokens';
import { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { ContentTypeAssignmentEvent } from '../../analytics';
import { useWidgetStore } from '../../stores/widgets.store';
import { AnalyticsContentTypeAssignmentEventAction } from '../../types';
import { ContentTypeList } from './ContentTypeList';
import { WidgetEditor } from './editor/WidgetEditor';
import { WidgetEditorContextProvider } from './editor/WidgetEditorContext';
import { ContentTypeListContextProvider } from './ContentTypeListContext';

const Container = styled.div`
  background: ${tokens.gray100};
  padding: ${tokens.spacingXl};
  display: flex;
  justify-content: center;
  min-height: 100%;
`;

const Inner = styled.div`
  width: 1480px;
`;

export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const sdk = useSDK<AppExtensionSDK>();

  const { contentTypeDefs, setInitialContentTypes } = useWidgetStore((state) => state);

  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    const newInterfaces = Object.values(contentTypeDefs).reduce((acc, el) => {
      const obj: any = {};
      if (el.sidebar?.widgets) {
        // todo make position adjustable
        obj.sidebar = { position: 0 };
      }
      if (el.fields) {
        obj.controls = Object.values(el.fields)
          .filter((field) => {
            return field && field.widgets && field.widgets.length > 0;
          })
          .map((fieldDef) => {
            return {
              fieldId: fieldDef.id,
            };
          });
      }

      return { ...acc, [el.id]: obj };
    }, {});

    ContentTypeAssignmentEvent(AnalyticsContentTypeAssignmentEventAction.WIDGET_SAVED);

    return {
      // Parameters to be persisted as the app configuration.
      parameters: { defs: contentTypeDefs },
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: {
        ...currentState,
        EditorInterface: { ...currentState?.EditorInterface, ...newInterfaces },
      },
    };
  }, [sdk, contentTypeDefs]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      // @ts-expect-error
      if (currentParameters?.defs) {
        setInitialContentTypes(
          // @ts-expect-error
          currentParameters.defs
        );
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <ContentTypeListContextProvider>
      <Container>
        <Inner>
          <Routes>
            <Route path="/" element={<ContentTypeList />} />
            <Route
              path="/ct/:contentTypeId/sidebar"
              element={
                <WidgetEditorContextProvider>
                  <WidgetEditor />
                </WidgetEditorContextProvider>
              }
            />
            <Route
              path="/ct/:contentTypeId/field/:fieldId"
              element={
                <WidgetEditorContextProvider>
                  <WidgetEditor />
                </WidgetEditorContextProvider>
              }
            />
            <Route path="*" element={<div>404</div>} />
          </Routes>
        </Inner>
      </Container>
    </ContentTypeListContextProvider>
  );
};

export default ConfigScreen;
