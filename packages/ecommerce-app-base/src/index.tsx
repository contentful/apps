import { ConfigAppSDK, DialogAppSDK, init, locations } from '@contentful/app-sdk';
import { GlobalStyles } from '@contentful/f36-components';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import AppConfig from './AppConfig/AppConfig';
import { Field, IntegrationProvider } from './Editor';
import { Integration, Product } from './types';
import { SDKProvider } from '@contentful/react-apps-toolkit';

export function setup<P extends Product = Product>(integration: Integration<P>) {
  init((sdk) => {
    const container = document.getElementById('root');
    const root = createRoot(container!);

    if (sdk.location.is(locations.LOCATION_DIALOG)) {
      integration.renderDialog(sdk as DialogAppSDK);
    }

    if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
      root.render(
        <IntegrationProvider integration={integration}>
          <SDKProvider>
            <GlobalStyles />
            <Field />
          </SDKProvider>
        </IntegrationProvider>
      );
    }

    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      root.render(
        <>
          <GlobalStyles />
          <SDKProvider>
            <AppConfig
              name={integration.name}
              sdk={sdk as ConfigAppSDK}
              parameterDefinitions={integration.parameterDefinitions}
              validateParameters={integration.validateParameters}
              logo={integration.logo}
              color={integration.color}
              description={integration.description}
              skuTypes={integration.skuTypes}
              isInOrchestrationEAP={integration.isInOrchestrationEAP}
            />
          </SDKProvider>
        </>
      );
    }
  });
}

// we should not export everything here
export * from './types';
export * from './AdditionalDataRenderer';
export { renderSkuPicker } from './SkuPicker/renderSkuPicker';
