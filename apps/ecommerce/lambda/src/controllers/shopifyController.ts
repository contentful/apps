import { Request, Response } from 'express';
import { ExternalResourceLink, ErrorResponse } from '../types';
import { convertResponseToResource } from '../helpers/shopifyAdapter';
import { ShopifyClientError, ShopifyProvider } from '../classes/Shopify';

const ShopifyController = {
  healthcheck: async (req: Request, res: Response): Promise<Response> => {
    try {
      const domain = req.header('x-contentful-shopify-domain') || '';
      const storefrontAccessToken = req.header('x-contentful-shopify-token') || '';

      const shopifyClient = new ShopifyProvider({
        domain,
        storefrontAccessToken,
      });

      // prevent SSRF exploits
      // keys off of a .myshopify.com domain
      // TODO: find a more secure method since production domains for shopify stores will likely not pass the below condition
      if (!shopifyClient.isShopifyDomain(domain)) {
        throw new Error(`Invalid domain provider. Provider must be a Shopify domain.`);
      }
      const response = await shopifyClient.client.shop.fetchInfo();
      return res.send(response);
    } catch (error) {
      return res.status(500).send({
        status: 'error',
        message: (error as Error).message,
      });
    }
  },
  resource: async (
    req: Request<ExternalResourceLink>,
    res: Response<ExternalResourceLink | ErrorResponse>
  ): Promise<Response<ExternalResourceLink>> => {
    const domain = req.header('x-contentful-shopify-domain') || '';
    const storefrontAccessToken = req.header('x-contentful-shopify-token') || '';
    const id = req.body.sys.urn;
    const shopifyClient = new ShopifyProvider({
      domain,
      storefrontAccessToken,
    });

    try {
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

      // prevent SSRF exploits
      // keys off of a .myshopify.com domain
      // TODO: find a more secure method since production domains for shopify stores will likely not pass the below condition
      if (!shopifyClient.isShopifyDomain(domain)) {
        throw new Error(`Invalid domain provider. Provider must be a Shopify domain.`);
      }

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
      if (error instanceof ShopifyClientError) {
        return res.status(500).send({
          status: 'error',
          message: 'Shopify provider not configured, credentials missing or incorrect.',
        });
      }
      return res.status(500).send({
        status: 'error',
        message: (error as Error).message,
      });
    }
  },
};

export default ShopifyController;
