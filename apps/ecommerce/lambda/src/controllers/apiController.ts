import { NextFunction, Request, Response } from 'express';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ExternalResource, ExternalResourceLink } from '@/src/types';

const ApiController = {
  config: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.appConfig) throw new Error('App config not found');

      const proxyConfigUrl = new URL(req.appConfig.baseUrl);
      proxyConfigUrl.pathname += `/config.json`;

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

  resources: async (
    req: Request,
    res: Response<ExternalResource[] | { status: 'ok' | 'error'; message: string }>,
    next: NextFunction
  ) => {
    try {
      const resourceLink: ExternalResourceLink = req.body;

      if (!req.appConfig) throw new Error('App config not found');

      const proxyResourceUrl = new URL(req.appConfig.baseUrl);
      proxyResourceUrl.pathname += `/resources`;

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
      proxyResourceUrl.pathname += `/resourcesTypes`;

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
