import { Request, Response } from 'express';
import { ExternalResourceLink, ErrorResponse, ProviderConfig } from '../types';
import Client from 'shopify-buy';
import { convertResponseToResource } from '../helpers/shopifyAdapter';
import { PROVIDER_CONFIGS } from '../mocks/providerConfigs';

interface ShopifyParams {
  domain: string;
  storefrontAccessToken: string;
}

const makeShopifyClient = (params: ShopifyParams) => {
  return Client.buildClient({
    ...params,
    apiVersion: '2023-04',
  });
};

const ShopifyController = {
  healthcheck: async (req: Request<ShopifyParams>, res: Response): Promise<Response> => {
    try {
      const client = makeShopifyClient({
        domain: req.body.domain,
        storefrontAccessToken: req.body.storefrontAccessToken,
      });
      const response = await client.shop.fetchInfo();
      return res.send(response);
    } catch (error) {
      return res.status(500).send({
        status: 'error',
        message: error,
      });
    }
  },
  resource: async (
    req: Request<ExternalResourceLink>,
    res: Response<ExternalResourceLink | ErrorResponse>
  ): Promise<Response<ExternalResourceLink>> => {
    const id = req.body.sys.urn;
    const client = makeShopifyClient({
      domain: req.body.domain,
      storefrontAccessToken: req.body.storefrontAccessToken,
    });
    if (id.match(/\/not_found$/)) {
      return res.status(404).send({
        status: 'error',
        message: 'Not found',
      });
    } else if (id.match(/\/bad_request$/)) {
      return res.status(400).send({
        status: 'error',
        message: 'Bad request',
      });
    }
    try {
      const product = await client.product.fetch(id);
      if (product) {
        return res.send({
          sys: req.body.sys,
          ...convertResponseToResource(product),
        });
      } else {
        return res.status(404).send({
          status: 'error',
          message: `Product Not Found for id ${id}`,
        });
      }
    } catch (error) {
      return res.status(500).send({
        status: 'error',
        message: error,
      });
    }
  },
  config: (_req: Request, res: Response<ProviderConfig>): Response<ProviderConfig> => {
    return res.send(PROVIDER_CONFIGS.shopify);
  },
};

export default ShopifyController;
