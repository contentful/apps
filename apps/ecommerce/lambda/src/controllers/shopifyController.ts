import { Request, Response } from 'express';
import { HydratedResourceData, ResourceLink } from '../types';
import { mockResourceData } from '../mocks/resourceData.mock';

type CombinedResource = ResourceLink & HydratedResourceData;

const ShopifyController = {
  resource: (
    req: Request<ResourceLink>,
    res: Response<CombinedResource>
  ): Response<CombinedResource> => {
    return res.send({
      sys: req.body.sys,
      ...mockResourceData,
    });
  },
};

export default ShopifyController;
