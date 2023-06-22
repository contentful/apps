import { getApplicationKeyService, getBaseSitesService } from '../services/sap/SAPService';
import { Router } from 'express';
import { Request, Response } from 'express';

const SAPController = Router();

export const getApplicationKey = async (req: Request, res: Response) => {
  const sapAppKey = await getApplicationKeyService();
  return res.status(sapAppKey.status).send(sapAppKey);
};

export const getBaseSites = async (req: Request, res: Response) => {
  // TODO: Get the apiEndpoint from installation parameters
  const { applicationInterfaceKey, apiEndpoint } = JSON.parse(JSON.stringify(req.headers));
  const baseSitesResponse = await getBaseSitesService(apiEndpoint, applicationInterfaceKey);
  return res.status(200).send(baseSitesResponse);
};

SAPController.get('/', getApplicationKey);
SAPController.get('/base-sites', getBaseSites);

export default SAPController;
