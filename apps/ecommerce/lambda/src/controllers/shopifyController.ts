import { Request, Response } from 'express';
import { HydratedResourceData, ResourceLink } from '../types';

type CombinedResource = ResourceLink & HydratedResourceData;

const ShopifyController = {
  resource: (
    req: Request<ResourceLink>,
    res: Response<CombinedResource>
  ): Response<CombinedResource> => {
    return res
      .send({
        sys: req.body.sys,
        name: 'Metallica T Shirt',
        description: "An awesome men's T-shirt with metallica on it",
        status: 'Out of stock',
        image: 'https://cdn.shopify.com/images/foobar.jpg',
        extras: {
          sku: 'abc123',
        },
      })
      .status(200);
  },
};

export default ShopifyController;
