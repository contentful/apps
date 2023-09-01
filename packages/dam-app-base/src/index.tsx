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
            cta={integration.cta}
            logo={integration.logo}
            makeThumbnail={integration.makeThumbnail}
            openDialog={integration.openDialog}
            isDisabled={integration.isDisabled}
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
          />
        </>,
        root
      );
    }
  });
}

export * from './AppConfig/fields';
export * from './interfaces';
