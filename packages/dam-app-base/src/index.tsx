import { ConfigAppSDK, DialogAppSDK, FieldAppSDK, init, locations } from '@contentful/app-sdk';
import { GlobalStyles } from '@contentful/f36-components';
import { createRoot } from 'react-dom/client';

import AppConfig from './AppConfig/AppConfig';
import Field from './Editor/Field';
import { Integration } from './interfaces';

export function setup(integration: Integration) {
  init((sdk) => {
    const container = document.getElementById('root') as HTMLElement;
    const root = createRoot(container);

    if (sdk.location.is(locations.LOCATION_DIALOG)) {
      integration.renderDialog(sdk as DialogAppSDK);
    }

    if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
      root.render(
        <>
          <GlobalStyles />
          <Field
            sdk={sdk as FieldAppSDK}
            cta={integration.cta}
            logo={integration.logo}
            makeThumbnail={integration.makeThumbnail}
            openDialog={integration.openDialog}
            isDisabled={integration.isDisabled}
            customUpdateStateValue={integration.customUpdateStateValue ?? null}
            getAdditionalData={integration.getAdditionalData ?? null}
          />
        </>
      );
    }

    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      root.render(
        <>
          <GlobalStyles />
          <AppConfig
            name={integration.name}
            sdk={sdk as ConfigAppSDK}
            parameterDefinitions={integration.parameterDefinitions}
            validateParameters={integration.validateParameters}
            logo={integration.logo}
            color={integration.color}
            description={integration.description}
          />
        </>
      );
    }
  });
}

export * from './AppConfig/fields';
export * from './interfaces';
