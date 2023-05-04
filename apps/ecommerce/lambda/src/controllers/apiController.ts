import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import { HydratedResourceData, ResourceLink } from '@/src/types';
import { config } from '../config';
const BASE_URL = config.baseUrl;

interface Provider {
  name: string;
  resourceURL: string;
}

const PROVIDERS = [
  {
    name: 'shopify',
    resourceURL: `${BASE_URL}/shopify/resource`,
  },
];

const ApiController = {
  ping: (req: Request, res: Response) => {
    return res.send({ status: 'ok', message: 'pong' });
  },
  resource: async (
    req: Request,
    res: Response<HydratedResourceData | { error?: unknown; message: string }>
  ) => {
    const body: ResourceLink = req.body;
    const provider = body.sys.provider;
    const entityType = body.sys.linkType;
    const index = PROVIDERS.findIndex((p: Provider) => p.name === provider?.toLowerCase());

    if (index > -1) {
      try {
        const url = PROVIDERS[index].resourceURL;
        const response: AxiosResponse<HydratedResourceData> = await axios.post(url, body);
        res.status(response.status).send(response.data);
      } catch (error) {
        console.log(error);
        res.status(500).send({
          error,
          message: 'Could not get ' + entityType,
        });
      }
      console.log('some git');
    } else {
      res.status(500).send({
        message: `Could not find resource for provider: ${provider}`,
      });
    }
  },
};

export default ApiController;
