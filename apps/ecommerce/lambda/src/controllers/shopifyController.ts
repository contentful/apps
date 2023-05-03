import { Request, Response } from 'express';

const ShopifyController = {
  resource: (req: Request, res: Response) => {
    console.log(req.params.name);
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

export default ShopifyController;
