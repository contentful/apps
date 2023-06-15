import {
  appInstallConfig,
  resourceTypeConfig,
  shopifySchema,
} from '../services/resourceType/ResourceTypeService';
import { extractShopifyClientConfigParams } from '../helpers/ClientHelper';
import { Router } from 'express';
import { Request, Response } from 'express';
import { fetchProduct, fetchProducts } from '../handlers/ShopifyHandler';

const ResourceTypeController = Router();

const getAppInstallConfig = async (req: Request, res: Response) => {
  return res.status(200).send(appInstallConfig);
};

const getResourceTypeConfig = async (req: Request, res: Response) => {
  return res.status(200).send(resourceTypeConfig);
};

const getResourceTypeSchema = async (req: Request, res: Response) => {
  return res.status(200).send(shopifySchema);
};

const getResources = async (req: Request, res: Response) => {
  // TODO: HANDLE PAGINATION, QUERYING, NOR PAGINATION

  // Have parse twice, one because we stringify the header here, second because the header in the request is also stringified,
  // this is because the x-data-provider-parameters header represents an object which needs to be stringified before being sent as a request
  const providerHeaders = JSON.parse(
    JSON.parse(JSON.stringify(req.header('x-data-provider-parameters')))
  );
  const { shopName, storefrontAccessToken } = providerHeaders;
  const domain = extractShopifyClientConfigParams({
    shopName,
    storefrontAccessToken,
  });

  // TODO: Use this once we do the multi-resource ticket
  // const resourcesType = decodeURIComponent(JSON.parse(JSON.stringify(req.header('x-resource-type'))));

  const products = await fetchProducts({ domain, storefrontAccessToken });
  return res.status(200).send(products);
};

const getOneResource = async (req: Request, res: Response) => {
  const providerHeaders = JSON.parse(
    JSON.parse(JSON.stringify(req.header('x-data-provider-parameters')))
  );

  // TODO: Use this once we do the multi-resource ticket
  // const resourcesType = decodeURIComponent(JSON.parse(JSON.stringify(req.header('x-resource-type'))));
  const resourceId = decodeURIComponent(JSON.parse(JSON.stringify(req.header('x-resource-id'))));

  const { shopName, storefrontAccessToken } = providerHeaders;
  const domain = extractShopifyClientConfigParams({
    shopName,
    storefrontAccessToken,
  });

  const product = await fetchProduct({ domain, storefrontAccessToken }, resourceId);

  return res.status(200).send(product);
};

ResourceTypeController.get('/', getAppInstallConfig);
ResourceTypeController.get('/config', getResourceTypeConfig);
ResourceTypeController.get('/schema', getResourceTypeSchema);
ResourceTypeController.get('/resources', getResources);
ResourceTypeController.get('/resources/single', getOneResource);

export default ResourceTypeController;
