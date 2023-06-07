import { resourceTypeConfig, shopifySchema } from '../services/resourceType/ResourceTypeService';
import { extractShopifyClientConfigParams } from '../helpers/ClientHelper';
import { Router } from 'express';
import { Request, Response } from 'express';
import { fetchProduct, fetchProducts } from '../handlers/ShopifyHandler';
import { metadata } from '../services/metadata/MetadataService';

const ResourceTypeController = Router();

const getResourceTypeMetadata = async (req: Request, res: Response) => {
  return res.status(200).send(metadata);
};

const getResourceTypeConfig = async (req: Request, res: Response) => {
  return res.status(200).send(resourceTypeConfig);
};

const getResourceTypeSchema = async (req: Request, res: Response) => {
  return res.status(200).send(shopifySchema);
};

const getResources = async (req: Request, res: Response) => {
  // TODO: HANDLE PAGINATION, QUERYING, NOR PAGINATION
  const storefrontAccessToken = JSON.parse(JSON.stringify(req.header('x-storefront-access-token')));
  const shopName = JSON.parse(JSON.stringify(req.header('x-shop-name')));
  const domain = extractShopifyClientConfigParams({
    shopName,
    storefrontAccessToken,
  });

  const products = await fetchProducts({ domain, storefrontAccessToken });
  return res.status(200).send(products);
};

const getOneResource = async (req: Request, res: Response) => {
  const storefrontAccessToken = JSON.parse(JSON.stringify(req.header('x-storefront-access-token')));
  const shopName = JSON.parse(JSON.stringify(req.header('x-shop-name')));
  const domain = extractShopifyClientConfigParams({
    shopName,
    storefrontAccessToken,
  });

  const id = decodeURIComponent(JSON.parse(JSON.stringify(req.params.resourceId))); // TODO: Implement error checking here
  const product = await fetchProduct({ domain, storefrontAccessToken }, id);

  return res.status(200).send(product);
};

ResourceTypeController.get('/', getResourceTypeMetadata);
ResourceTypeController.get('/:resourceType', getResourceTypeConfig);
ResourceTypeController.get('/:resourceType/schema', getResourceTypeSchema);
ResourceTypeController.get('/:resourceType/resources', getResources);
ResourceTypeController.get('/:resourceType/resources/:resourceId', getOneResource);

export default ResourceTypeController;
