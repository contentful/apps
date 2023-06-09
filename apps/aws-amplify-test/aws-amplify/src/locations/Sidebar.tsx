import React from 'react';
import { Paragraph } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { Button } from '@aws-amplify/ui-react';
import Axios from 'axios';

(function () {
  var cors_api_host = 'cors-anywhere.herokuapp.com';
  var cors_api_url = 'https://' + cors_api_host + '/';
  var slice = [].slice;
  var origin = window.location.protocol + '//' + window.location.host;
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () {
    var args: any = slice.call(arguments);
    // eslint-disable-next-line no-useless-escape
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
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const buildAmplifyApp = () => {
    const webhookURL = '';
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
        console.log(response);
      } catch (error) {
        console.error(error, error);
      }
    };
    initBuild();
  };

  return (
    <Paragraph>
      <Button variation="primary" loadingText="" onClick={buildAmplifyApp} ariaLabel="">
        Build
      </Button>
    </Paragraph>
  );
};

export default Sidebar;
