import { Request, Response } from 'express';
import { mockResourceData } from '../mocks/resource';

const ShopifyController = {
  resource: (req: Request, res: Response) => {
    if (req.body.sys.urn === 'gid://products/not_found') {
      return res.status(404).send({ status: 'error', message: 'Not found' });
    } else if (req.body.sys.urn === 'gid://products/bad_request') {
      return res.status(400).send({ status: 'error', message: 'Bad request' });
    }

    return res.send(mockResourceData);
  },
};

export default ShopifyController;
