import { AppConfiguration } from '..//types';
import {
  getProviderConfig,
  getOneProviderResource,
  getProviderAppInstallConfig,
  getProviderResources,
  getProviderSchema,
} from '../services/ProviderService';
import { Router } from 'express';
import { Request, Response } from 'express';

const ProviderController = Router();

const ping = async (req: Request, res: Response) => {
  return res.status(200).send('healthy!');
};

const getAppConfig = (req: Request): AppConfiguration => {
  if (!req.appConfig) throw new Error('App config not found');
  return req.appConfig;
};

const getAppInstallationParameters = (req: Request) => {
  if (!req.installationParameters) throw new Error('Installation parameters not found');
  return req.installationParameters;
};

const getAppInstallConfig = async (req: Request, res: Response) => {
  const appConfig = getAppConfig(req);
  const providerMetadata = await getProviderAppInstallConfig(appConfig.baseUrl);
  return res.status(200).send(providerMetadata);
};

const getResourceTypeConfig = async (req: Request, res: Response) => {
  const appConfig = getAppConfig(req);
  const providerMetadata = await getProviderConfig(appConfig.baseUrl);
  return res.status(200).send(providerMetadata);
};

const getResourceTypeSchema = async (req: Request, res: Response) => {
  const appConfig = getAppConfig(req);
  const providerMetadata = await getProviderSchema(appConfig.baseUrl);
  return res.status(200).send(providerMetadata);
};

const getResources = async (req: Request, res: Response) => {
  const appConfig = getAppConfig(req);
  const appInstallationParameters = getAppInstallationParameters(req);
  const { baseUrl } = appConfig;

  const providerResources = await getProviderResources(baseUrl, appInstallationParameters);
  return res.status(200).send(providerResources);
};

const getOneResource = async (req: Request, res: Response) => {
  const appConfig = getAppConfig(req);
  const appInstallationParameters = getAppInstallationParameters(req);
  const resourceId = decodeURIComponent(JSON.parse(JSON.stringify(req.params.resourceId)));
  const resourceType = decodeURIComponent(JSON.parse(JSON.stringify(req.params.resourceType)));
  const { baseUrl } = appConfig;

  const providerResource = await getOneProviderResource(
    resourceId,
    resourceType,
    baseUrl,
    appInstallationParameters
  );
  return res.status(200).send(providerResource);
};

ProviderController.get('/', ping);
ProviderController.get('/:appInstallationId', getAppInstallConfig);
ProviderController.get(
  '/:appInstallationId/resourcesTypes/:resourceType/config',
  getResourceTypeConfig
);
ProviderController.get(
  '/:appInstallationId/resourcesTypes/:resourceType/schema',
  getResourceTypeSchema
);
ProviderController.get('/:appInstallationId/resourcesTypes/:resourceType/resources', getResources);
ProviderController.get(
  '/:appInstallationId/resourcesTypes/:resourceType/resources/:resourceId',
  getOneResource
);

export default ProviderController;
