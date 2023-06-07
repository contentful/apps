import { NextFunction, Request, Response } from 'express';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ExternalResource, ExternalResourceLink } from '@/src/types';
import { convertResponseToResource } from '../helpers/shopifyAdapter';
import { Product } from 'shopify-buy';

const ApiController = {
  config: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.appConfig) throw new Error('App config not found');

      const proxyConfigUrl = new URL(req.appConfig.baseUrl);
      proxyConfigUrl.pathname += `/metadata`;

      try {
        let response;
        try {
          response = await axios.get(proxyConfigUrl.toString());
        } catch (error) {
          response = (error as AxiosError).response;
        } finally {
          res
            .status((response as AxiosResponse).status)
            .send(JSON.parse(JSON.stringify((response as AxiosResponse).data)));
        }
      } catch (error) {
        res.status(500).send({
          status: 'error',
          message: 'Error fetching config',
        });
      }
    } catch (error) {
      next(error);
    }
  },

  checkCredentials: async (
    req: Request,
    res: Response<ShopifyBuy.ShopResource | { status: 'ok' | 'error'; message: string }>,
    next: NextFunction
  ) => {
    try {
      if (!req.appConfig) throw new Error('App config not found');

      const proxyResourceUrl = new URL(req.appConfig.baseUrl);
      proxyResourceUrl.pathname += `/credentials`;

      try {
        let response;
        try {
          response = await axios.get(proxyResourceUrl.toString(), {
            headers: {
              'x-data-provider-parameters': JSON.stringify(req.installationParameters),
            },
          });
        } catch (error) {
          response = (error as AxiosError).response;
        } finally {
          res
            .status((response as AxiosResponse).status)
            .send(JSON.parse(JSON.stringify((response as AxiosResponse).data)));
        }
      } catch (error) {
        res.status(500).send({
          status: 'error',
          message: 'Error fetching resource',
        });
      }
    } catch (error) {
      next(error);
    }
  },

  resource: async (
    req: Request,
    res: Response<ExternalResource | { status: 'ok' | 'error'; message: string }>,
    next: NextFunction
  ) => {
    try {
      const resourceLink: ExternalResourceLink = req.body;

      if (!req.appConfig) throw new Error('App config not found');

      const proxyResourceUrl = new URL(req.appConfig.baseUrl);
      const resourceId = encodeURIComponent(resourceLink.sys.urn);
      proxyResourceUrl.pathname += `/resourcesTypes/test/resources/${resourceId}`; // TODO: Replace /test path with actual resource type

      try {
        let response;
        try {
          const { shopName, storefrontAccessToken } = req.installationParameters;
          response = await axios.get(proxyResourceUrl.toString(), {
            headers: {
              'x-storefront-access-token': storefrontAccessToken,
              'x-shop-name': shopName,
            },
          });

          const convertedProduct = convertResponseToResource(response.data);
          res
            .status((response as AxiosResponse).status)
            .send(JSON.parse(JSON.stringify(convertedProduct)));
        } catch (error) {
          response = (error as AxiosError).response;
          res.status((response as AxiosResponse).status).send(JSON.parse(JSON.stringify(response)));
        }
      } catch (error) {
        res.status(500).send({
          status: 'error',
          message: 'Error fetching resource',
        });
      }
    } catch (error) {
      next(error);
    }
  },

  resources: async (
    req: Request,
    res: Response<ExternalResource[] | { status: 'ok' | 'error'; message: string }>,
    next: NextFunction
  ) => {
    try {
      if (!req.appConfig) throw new Error('App config not found');

      const proxyResourceUrl = new URL(req.appConfig.baseUrl);
      proxyResourceUrl.pathname += `/resourcesTypes/test/resources`; // TODO: Replace /test path with actual resource type

      try {
        let response;
        try {
          const { shopName, storefrontAccessToken } = req.installationParameters;
          response = await axios.get(proxyResourceUrl.toString(), {
            headers: {
              'x-storefront-access-token': storefrontAccessToken,
              'x-shop-name': shopName,
            },
          });

          const convertedProducts = response.data.map((product: Product) =>
            convertResponseToResource(product)
          );
          res
            .status((response as AxiosResponse).status)
            .send(JSON.parse(JSON.stringify(convertedProducts)));
        } catch (error) {
          response = (error as AxiosError).response;
          res.status((response as AxiosResponse).status).send(JSON.parse(JSON.stringify(response)));
        }
      } catch (error) {
        res.status(500).send({
          status: 'error',
          message: 'Error fetching resource',
        });
      }
    } catch (error) {
      next(error);
    }
  },

  // TODO: Figure out the exact return type, use unknown as a placeholder for now (could be appropriate in the
  //       long run, but it's not clear yet).
  resourceType: async (
    req: Request,
    res: Response<unknown | { status: 'ok' | 'error'; message: string }>,
    next: NextFunction
  ) => {
    try {
      const resourceLink: ExternalResourceLink = req.body;

      if (!req.appConfig) throw new Error('App config not found');

      const proxyResourceUrl = new URL(req.appConfig.baseUrl);
      proxyResourceUrl.pathname += `/resourcesTypes/test`; // TODO: Replace /test path with actual resource type

      try {
        let response;
        try {
          response = await axios.post(proxyResourceUrl.toString(), resourceLink, {
            headers: {
              'x-data-provider-parameters': JSON.stringify(req.installationParameters),
            },
          });
        } catch (error) {
          response = (error as AxiosError).response;
        } finally {
          res
            .status((response as AxiosResponse).status)
            .send(JSON.parse(JSON.stringify((response as AxiosResponse).data)));
        }
      } catch (error) {
        res.status(500).send({
          status: 'error',
          message: 'Error fetching resource',
        });
      }
    } catch (error) {
      next(error);
    }
  },
};

export default ApiController;
