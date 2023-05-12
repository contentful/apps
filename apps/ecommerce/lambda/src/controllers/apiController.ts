import { NextFunction, Request, Response } from 'express';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ExternalResource, ExternalResourceLink } from '@/src/types';
import { config } from '../config';

const ApiController = {
  ping: (req: Request, res: Response) => {
    return res.send({ status: 'ok', message: 'pong' });
  },

  resource: async (
    req: Request,
    res: Response<ExternalResource | { error?: unknown; message: string }>,
    next: NextFunction
  ) => {
    try {
      const resourceLink: ExternalResourceLink = req.body;
      const resourceProvider = req.header('x-contentful-data-provider');
      const proxyBaseUrl = req.header('x-contentful-data-provider-baseurl');

      if (!proxyBaseUrl) {
        return res.status(404).send({
          status: 'error',
          message: `Base URL configuration for provider${
            resourceProvider ? `: "${resourceProvider}"` : ''
          } not found`,
        });
      }

      // TODO: fetch provider config from `${proxyBaseUrl}/config.json`
      const proxyResourceUrl = new URL(proxyBaseUrl);
      proxyResourceUrl.pathname += `/resource`;

      // prevent SSRF exploits
      // TODO: refactor this to get the proxy resource url from the app definition
      // configuration parameters once this is an internal Contentful service
      if (proxyResourceUrl.hostname !== config.domainName) {
        // temporary: only support data provider proxying on the same domain to avoid SSRF exploits
        throw new Error(`Invalid data provider base URL. Hostname must be ${config.domainName}`);
      }

      try {
        let response;
        try {
          response = await axios.post(proxyResourceUrl.toString(), resourceLink);
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
