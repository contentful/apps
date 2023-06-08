import { Paragraph, Button } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import Axios, { AxiosError } from 'axios';
import { useState } from 'react';

(function () {
  var cors_api_host = 'cors-anywhere.herokuapp.com';
  var cors_api_url = 'https://' + cors_api_host + '/';
  var slice = [].slice;
  var origin = window.location.protocol + '//' + window.location.host;
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () {
    var args: any = slice.call(arguments);
    var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(args[1]);
    if (
      targetOrigin &&
      targetOrigin[0].toLowerCase() !== origin &&
      targetOrigin[1] !== cors_api_host
    ) {
      args[1] = cors_api_url + args[1];
    }
    return open.apply(this, args);
  };
})();

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const errorText = 'The AWS website build was not triggered. Try again later.';
  const [isLoading, setIsLoading] = useState(false);
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const buildAmplifyApp = () => {
    setIsLoading(true);
    const webhookURL =
      'https://webhooks.amplify.us-east-1.amazonaws.com/prod/webhooks?id=7a31abcf-724e-4072-9329-8541f4e3bb02&token=Lba6wO2uyDKgDA6BmHcqUqXefzVZa9GG8r23HNQVuc';
    const initBuild = async () => {
      try {
        const response = await Axios({
          method: 'post',
          url: webhookURL,
          data: {},
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.status === 202) sdk.notifier.success('The AWS website build was triggered.');
        else throw new Error(errorText);
      } catch (error) {
        if (error instanceof AxiosError) {
          sdk.notifier.error(errorText);
        } else sdk.notifier.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    initBuild();
  };

  return (
    <Paragraph>
      <Button
        variant="primary"
        isFullWidth={true}
        isLoading={isLoading}
        isDisabled={isLoading}
        onClick={buildAmplifyApp}>
        {isLoading ? 'Building' : 'Build website'}
      </Button>
    </Paragraph>
  );
};

export default Sidebar;
