import {
  getApplicationKeyService,
  getBaseSitesService,
  getProductListService,
  getProductPreviewsService,
} from '../services/sap/SAPService';
import { Router } from 'express';
import { Request, Response } from 'express';

const SAPController = Router();

export const getApplicationKey = async (req: Request, res: Response) => {
  const sapAppKey = await getApplicationKeyService();
  return res.status(sapAppKey.status).send(sapAppKey);
};

export const getBaseSites = async (req: Request, res: Response) => {
  const keyServiceRes = await getApplicationKeyService();
  const { sapApplicationId } = keyServiceRes;
  const { apiEndpoint } = req.installationParameters;
  const baseSitesResponse = await getBaseSitesService(apiEndpoint, sapApplicationId);
  return res.status(200).send(baseSitesResponse);
};

export const getProductList = async (req: Request, res: Response) => {
  const applicationInterfaceKey = await getApplicationKeyService();
  const { apiEndpoint, baseSite } = req.installationParameters;
  const products = await getProductListService(baseSite, apiEndpoint, applicationInterfaceKey);
  return res.status(200).send(products);
};

export const getProductPreview = async (req: Request, res: Response) => {
  const skus = JSON.parse(JSON.stringify(req.headers.skus));

  const applicationInterfaceKey = await getApplicationKeyService();
  const { apiEndpoint } = req.installationParameters;
  const products = await getProductPreviewsService(skus, apiEndpoint, applicationInterfaceKey);
  return res.status(200).send(products);
};

SAPController.get('/', getApplicationKey);
SAPController.get('/base-sites', getBaseSites);
SAPController.get('/product-list', getProductList);
SAPController.get('/product-preview', getProductPreview);

export default SAPController;
