import { ConfigAppSDK, DialogAppSDK, init, locations } from '@contentful/app-sdk';
import { GlobalStyles } from '@contentful/f36-components';
import * as React from 'react';
import { render } from 'react-dom';
import AppConfig from './AppConfig/AppConfig';
import { Field, IntegrationProvider } from './Editor';
import { Integration } from './types';
import { SDKProvider } from '@contentful/react-apps-toolkit';

export function setup(integration: Integration) {
  init((sdk) => {
    const root = document.getElementById('root');

    if (sdk.location.is(locations.LOCATION_DIALOG)) {
      integration.renderDialog(sdk as DialogAppSDK);
    }

    if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
      render(
        <IntegrationProvider integration={integration}>
          <SDKProvider>
            <GlobalStyles />
            <Field />
          </SDKProvider>
        </IntegrationProvider>,
        root
      );
    }

    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      render(
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
        </>,
        root
      );
    }
  });
}

// we should not export everything here
export * from './types';
export { renderSkuPicker } from './SkuPicker/renderSkuPicker';
