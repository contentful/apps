import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import { HydratedResourceData, ResourceLink } from '@/src/types';
import { config } from '../config';

const ApiController = {
  ping: (req: Request, res: Response) => {
    return res.send({ status: 'ok', message: 'pong' });
  },
  resource: async (req: Request, res: Response<HydratedResourceData>) => {
    const body: ResourceLink = req.body;
    const BASE_URL = config.baseUrl;
    const url = `${BASE_URL}/${body.sys.provider.toLowerCase()}/resource/${body.sys.linkType}/${
      req.params.id
    }`;

    const response: AxiosResponse<HydratedResourceData> = await axios.post(url, req.body);
    res.send(response.data).status(response.status);
  },
};

export default ApiController;
