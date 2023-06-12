import {
  getOneProviderResource,
  getProviderConfig,
  getProviderResources,
  getProviderSchema,
} from '../services/ProviderService';
import { Router } from 'express';
import { Request, Response } from 'express';

const ProviderController = Router();

const ping = async (req: Request, res: Response) => {
  return res.status(200).send('healthy!');
};

const getAppInstallationId = async (req: Request, res: Response) => {
  const providerUrl = JSON.parse(JSON.stringify(req.header('x-provider-url')));
  const providerMetadata = await getProviderConfig(providerUrl);
  return res.status(200).send(providerMetadata);
};

const getResourceTypeSchema = async (req: Request, res: Response) => {
  const providerUrl = JSON.parse(JSON.stringify(req.header('x-provider-url')));
  const resourceType = JSON.parse(JSON.stringify(req.params.resourceType));
  const providerMetadata = await getProviderSchema({ providerUrl, resourceType });
  return res.status(200).send(providerMetadata);
};

const getResources = async (req: Request, res: Response) => {
  const providerUrl = JSON.parse(JSON.stringify(req.header('x-provider-url')));
  const accessToken = JSON.parse(JSON.stringify(req.header('x-storefront-access-token')));
  const shopName = JSON.parse(JSON.stringify(req.header('x-shop-name')));

  const resourceType = JSON.parse(JSON.stringify(req.params.resourceType));
  const providerResources = await getProviderResources({
    providerUrl,
    resourceType,
    accessToken,
    shopName,
  });
  return res.status(200).send(providerResources);
};

const getOneResource = async (req: Request, res: Response) => {
  const providerUrl = JSON.parse(JSON.stringify(req.header('x-provider-url')));
  const accessToken = JSON.parse(JSON.stringify(req.header('x-storefront-access-token')));
  const shopName = JSON.parse(JSON.stringify(req.header('x-shop-name')));

  const resourceType = JSON.parse(JSON.stringify(req.params.resourceType));
  const resourceId = decodeURIComponent(JSON.parse(JSON.stringify(req.params.resourceId)));

  const providerResource = await getOneProviderResource({
    providerUrl,
    resourceType,
    accessToken,
    shopName,
    resourceId,
  });
  return res.status(200).send(providerResource);
};

ProviderController.get('/', ping);
ProviderController.get('/:appInstallationId', getAppInstallationId);
ProviderController.get('/:appInstallationId/resourcesTypes/:resourceType', getResourceTypeSchema);
ProviderController.get('/:appInstallationId/resourcesTypes/:resourceType/resources', getResources);
ProviderController.get(
  '/:appInstallationId/resourcesTypes/:resourceType/resources/:resourceId',
  getOneResource
);

export default ProviderController;
