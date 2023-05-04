import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import { HydratedResourceData, ResourceLink } from '@/src/types';
import { config } from '../config';

const ApiController = {
  ping: (req: Request, res: Response) => {
    return res.send({ status: 'ok', message: 'pong' });
  },
  resource: async (
    req: Request,
    res: Response<HydratedResourceData | { error: any; message: string }>
  ) => {
    const body: ResourceLink = req.body;
    const BASE_URL = config.baseUrl;
    const provider = body.sys.provider.toLowerCase();
    const entityType = body.sys.linkType.toLowerCase();

    try {
      const url = `${BASE_URL}/${provider}/resource/${entityType}/${req.params.id}`;

      const response: AxiosResponse<HydratedResourceData> = await axios.post(url, body);
      res.status(response.status).send(response.data);
    } catch (error) {
      res.status(500).send({
        error,
        message: 'Could not get ' + entityType + ' with ID: ' + req.params.id,
      });
    }
  },
};

export default ApiController;
