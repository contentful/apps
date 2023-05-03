import { Request, Response } from 'express';
import { ResourceLink } from '@/src/types';

const ApiController = {
  ping: (req: Request, res: Response) => {
    return res.send({ status: 'ok', message: 'pong' });
  },
  resource: (req: Request, res: Response) => {
    const body: ResourceLink = req.body;
  },
  product: (req: Request, res: Response) => {
    console.log(req.params);
    return res.send({
      sys: {
        type: 'ResourceLink',
        linkType: 'IntegrationResource',
        urn: 'crn:shopify:::product:products/8191006998814',
      },
      name: 'Metallica T Shirt',
      description: "An awesome men's T-shirt with metallica on it",
      status: 'Out of stock',
      image: 'https://cdn.shopify.com/images/foobar.jpg',
      extras: {
        sku: 'abc123',
      },
    });
  },
};

export default ApiController;
