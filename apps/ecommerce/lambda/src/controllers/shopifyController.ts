import { Request, Response } from 'express';
import { ExternalResourceLink, ErrorResponse } from '../types';
import { convertResponseToResource } from '../helpers/shopifyAdapter';
import { ShopifyClientError, ShopifyProvider } from '../classes/Shopify';

const ShopifyController = {
  checkCredentials: async (req: Request, res: Response): Promise<Response> => {
    try {
      const shopifyClient = new ShopifyProvider(
        createShopifyClientConfig(req.header('x-data-provider-parameters'))
      );

      const response = await shopifyClient.client.shop.fetchInfo();
      return res.send(response);
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        status: 'error',
        message: `Credentials check failed. Check storefront access token and shop name.`,
      });
    }
  },

  resource: async (
    req: Request<ExternalResourceLink>,
    res: Response<ExternalResourceLink | ErrorResponse>
  ): Promise<Response<ExternalResourceLink>> => {
    try {
      const shopifyClient = new ShopifyProvider(
        createShopifyClientConfig(req.header('x-data-provider-parameters'))
      );

      const id = req.body.sys.urn;
      const product = await shopifyClient.fetchProduct(id);

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
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof ShopifyClientError) {
        return res.status(error.cause.code === 'ENOTFOUND' ? 404 : 500).send({
          status: 'error',
          message: 'Shopify not configured, credentials missing or incorrect.',
        });
      }

      return res.status(500).send({
        status: 'error',
        message: (error as Error).message,
      });
    }
  },
};

const createShopifyClientConfig = (params = '{}') => {
  const { shopName, storefrontAccessToken } = JSON.parse(params);

  if (!shopName || !storefrontAccessToken)
    throw new Error(
      'Missing required parameters. shopName and storefrontAccessToken are required.'
    );

  const domain = `${shopName}.myshopify.com`;
  if (!!domain.match(/^[-a-z0-9]{2,256}\b([-a-z0-9]+)\.myshopify\.com$/) === false) {
    throw new Error('Invalid Shopify shop name');
  }

  return { domain, storefrontAccessToken };
};

export default ShopifyController;
