import { Request, Response } from 'express';
import { HydratedResourceData, ExternalResourceLink } from '../types';
import { mockResourceData } from '../mocks/resourceData.mock';

type CombinedResource = ExternalResourceLink & HydratedResourceData;

const ShopifyController = {
  resource: (
    req: Request<ExternalResourceLink>,
    res: Response<CombinedResource>
  ): Response<CombinedResource> => {
    return res.send({
      sys: req.body.sys,
      ...mockResourceData,
    });
  },
};

export default ShopifyController;
