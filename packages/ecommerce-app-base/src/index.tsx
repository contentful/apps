import {
  AppExtensionSDK,
  DialogExtensionSDK,
  FieldExtensionSDK,
  init,
  locations,
} from '@contentful/app-sdk';
import { GlobalStyles } from '@contentful/f36-components';
import * as React from 'react';
import { render } from 'react-dom';
import AppConfig from './AppConfig/AppConfig';
import Field from './Editor/Field';
import { Integration } from './interfaces';

export function setup(integration: Integration) {
  init((sdk) => {
    const root = document.getElementById('root');

    if (sdk.location.is(locations.LOCATION_DIALOG)) {
      integration.renderDialog(sdk as DialogExtensionSDK);
    }

    if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
      render(
        <>
          <GlobalStyles />
          <Field
            sdk={sdk as FieldExtensionSDK}
            makeCTA={integration.makeCTA}
            logo={integration.logo}
            fetchProductPreviews={integration.fetchProductPreviews}
            openDialog={integration.openDialog}
            isDisabled={integration.isDisabled}
            skuTypes={integration.skuTypes}
          />
        </>,
        root
      );
    }

    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      render(
        <>
          <GlobalStyles />
          <AppConfig
            name={integration.name}
            sdk={sdk as AppExtensionSDK}
            parameterDefinitions={integration.parameterDefinitions}
            validateParameters={integration.validateParameters}
            logo={integration.logo}
            color={integration.color}
            description={integration.description}
            skuTypes={integration.skuTypes}
          />
        </>,
        root
      );
    }
  });
}

export * from './interfaces';
export { renderSkuPicker } from './SkuPicker/renderSkuPicker';
