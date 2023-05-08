import { NextFunction, Request, Response } from 'express';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { HydratedResourceData, ExternalResourceLink } from '@/src/types';
import { config } from '../config';
const BASE_URL = config.baseUrl;

const PROVIDERS: Record<string, string> = {
  shopify: `${BASE_URL}/shopify/resource`,
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
          message: `Provider${
            resourceLink.sys.provider ? `: ${resourceLink.sys.provider}` : ''
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
          res.status((response as AxiosResponse).status).send((response as AxiosResponse).data);
        }
      } catch (error) {
        console.log('error', error);
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
