import { ConfigAppSDK } from '@contentful/app-sdk';
import AppConfig from '../components/AppConfig/AppConfig';
import { useSDK } from '@contentful/react-apps-toolkit';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();

  return (
    <AppConfig
      sdk={sdk as ConfigAppSDK}
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
  );
};

export default ConfigScreen;
