import { LATEST_API_VERSION, ConfigParams, ApiVersion } from '@shopify/shopify-api';
import { Request, Response } from 'express';
import { CombinedResource, ErrorResponse, ExternalResourceLink } from '../types';
import Client from 'shopify-buy';
import { convertResponseToResource } from '../helpers/shopifyAdapter'

// Initializing a client to return content in the store's primary language
const client = Client.buildClient({
  domain: 'contentful-test-app.myshopify.com',
  storefrontAccessToken: '',
  apiVersion: ApiVersion.April23
});

const ShopifyController = {
  resource: async (
    req: Request<ExternalResourceLink>,
    res: Response<CombinedResource | ErrorResponse>
  ): Promise<Response<CombinedResource>> => {
    const product = await client.product.fetch('gid://shopify/Product/8191006671134');

    if (req.body.sys.urn.match(/\/not_found$/)) {
      return res.status(404).send({
        status: 'error',
        message: 'Not found',
      });
    } else if (req.body.sys.urn.match(/\/bad_request$/)) {
      return res.status(400).send({
        status: 'error',
        message: 'Bad request',
      });
    }

    return res.send({
      sys: req.body.sys,
      ...convertResponseToResource(product),
    });
  },
};

export default ShopifyController;
