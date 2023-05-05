import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import axios from 'axios';

const ApiController = {
  ping: (req: Request, res: Response) => {
    return res.send({ status: 'ok', message: 'pong' });
  },
  resource: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = req.body.sys.provider.toLowerCase();

      const url = `${config.baseUrl}${
        config.stage === 'dev' ? `/${config.stage}` : ''
      }/providers/${provider}/resource`;
      console.debug(`Proxying request to "${url}"...`);

      const proxyResponse = await axios
        .post(url, req.body)
        .then((response) => response)
        .catch((error) => error.response);

      return res.status(proxyResponse.status).send(proxyResponse.data);
    } catch (error) {
      console.error('error', error);
      next(error);
    }
  },
};

export default ApiController;
