import { NextFunction, Request, Response } from 'express';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ExternalResource, ExternalResourceLink } from '@/src/types';

const ApiController = {
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
      proxyResourceUrl.pathname += `/resource`;

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
