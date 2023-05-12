import { NextFunction, Request, Response } from 'express';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { HydratedResourceData, ExternalResourceLink } from '@/src/types';
import { config } from '../config';
const BASE_URL = `${config.baseUrl}${config.stage === 'prod' ? '' : `/${config.stage}`}`;

const PROVIDERS: Record<string, string> = {
  shopify: `${BASE_URL}/shopify/resource`,
  magento: `${BASE_URL}/magento/resource`,
};

const ApiController = {
  ping: (req: Request, res: Response) => {
    return res.send({ status: 'ok', message: 'pong' });
  },

  resource: async (
    req: Request,
    res: Response<HydratedResourceData | { error?: unknown; message: string }>,
    next: NextFunction
  ) => {
    try {
      const resourceLink: ExternalResourceLink = req.body;
      const proxyUrl = PROVIDERS[resourceLink.sys.provider.toLowerCase()];

      if (!proxyUrl) {
        return res.status(404).send({
          status: 'error',
          message: `Provider${resourceLink.sys.provider ? `: ${resourceLink.sys.provider}` : ''
            } not found`,
        });
      }

      try {
        let response;
        try {
          response = await axios.post(proxyUrl, resourceLink);
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
