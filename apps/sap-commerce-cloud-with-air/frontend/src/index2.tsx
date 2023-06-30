// TODO: Delete this file in a cleanup PR

import { render } from 'react-dom';

import { AppExtensionSDK, init, locations } from '@contentful/app-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import '@contentful/forma-36-tokens/dist/css/index.css';
import './index.css';
import AppConfig from './AppConfig/AppConfig';

import { config } from './config';

interface AWSFunctionURLResponse {
  status: number;
  sapApplicationId: string;
}

const getApplicationInterfaceKey = async (): Promise<boolean | string> => {
  const url = 'https://dpqac5rkzhh4cahlgb7jby4qk40qsetg.lambda-url.us-west-2.on.aws/';
  try {
    const response = await fetch(url);
    if (response.ok) {
      const responseJson: AWSFunctionURLResponse = await response.json();
      return responseJson.sapApplicationId;
    } else {
      throw response;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

init(async (sdk) => {
  const root = document.getElementById('root');
  // const isTestEnv = config.isTestEnv;
  // const sapApplicationInterfaceKey = !isTestEnv ? await getApplicationInterfaceKey() : '';
  const ComponentLocationSettings = [
    {
      location: locations.LOCATION_APP_CONFIG,
      component: (
        <AppConfig
          sdk={sdk as AppExtensionSDK}
          name="SAP Commerce Cloud App"
          description={`
            The SAP Commerce Cloud app allows content creators to select products from their
            SAP Commerce Cloud instance and reference them inside of Contentful entries.`}
          logo="https://images.ctfassets.net/lpjm8d10rkpy/6pMn4nHfKoOZGwFFcqaqqe/70272257dc1d2d0bbcc3ebdde13a7358/1493030643828.svg"
          color="212F3F"
          parameterDefinitions={[
            {
              id: 'apiEndpoint',
              name: 'API Endpoint',
              description: 'The API URL',
              type: 'Symbol',
              required: true,
            },
            {
              id: 'baseSites',
              name: 'Base Sites',
              description:
                'Include all base sites that you want to have available in the app. Separate each base site with a comma.',
              type: 'Symbol',
              required: true,
              default: '',
            },
          ]}
          validateParameters={() => null}
        />
      ),
    },
    {
      location: locations.LOCATION_ENTRY_FIELD,
      component: <div />,
    },
    {
      location: locations.LOCATION_DIALOG,
      component: <div />,
    },
  ];

  // Select a component depending on a location in which the app is rendered.
  ComponentLocationSettings.forEach((componentLocationSetting) => {
    if (sdk.location.is(componentLocationSetting.location)) {
      render(componentLocationSetting.component, root);
    }
  });
});
