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
  const proxyUrl = JSON.parse(JSON.stringify(req.header('x-proxy-url')));
  const providerMetadata = await getProviderConfig(proxyUrl);
  return res.status(200).send(providerMetadata);
};

const getResourceTypeSchema = async (req: Request, res: Response) => {
  const proxyUrl = JSON.parse(JSON.stringify(req.header('x-proxy-url')));
  const resourceType = JSON.parse(JSON.stringify(req.params.resourceType));
  const providerMetadata = await getProviderSchema(proxyUrl, resourceType);
  return res.status(200).send(providerMetadata);
};

const getResources = async (req: Request, res: Response) => {
  const proxyUrl = JSON.parse(JSON.stringify(req.header('x-proxy-url')));
  const resourceType = JSON.parse(JSON.stringify(req.params.resourceType));
  const providerResources = await getProviderResources(proxyUrl, resourceType);
  return res.status(200).send(providerResources);
};

const getOneResource = async (req: Request, res: Response) => {
  const proxyUrl = JSON.parse(JSON.stringify(req.header('x-proxy-url')));
  const resourceType = JSON.parse(JSON.stringify(req.params.resourceType));
  const resourceId = decodeURIComponent(JSON.parse(JSON.stringify(req.params.resourceId)));

  const providerResource = await getOneProviderResource(proxyUrl, resourceType, resourceId);
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
