import { Request, Response } from 'express';
import { HydratedResourceData, ExternalResourceLink } from '../types';
import { mockResourceData } from '../mocks/resourceData.mock';

type CombinedResource = ExternalResourceLink & HydratedResourceData;
interface ErrorResponse {
  status: 'error';
  message: string;
}

const ShopifyController = {
  resource: (
    req: Request<ExternalResourceLink>,
    res: Response<CombinedResource | ErrorResponse>
  ): Response<CombinedResource> => {
    if (req.body.sys.urn.match(/\/not_found$/)) {
      return res.status(404).send({
        status: 'error',
        message: 'Not found',
      });
    } else if (req.body.sys.urn.match(/\/bad_request$/)) {
      return res.status(400).send({
        status: 'error',
        message: 'Bad request',
      });
    }

    return res.send({
      sys: req.body.sys,
      ...mockResourceData,
    });
  },
};

export default ShopifyController;
