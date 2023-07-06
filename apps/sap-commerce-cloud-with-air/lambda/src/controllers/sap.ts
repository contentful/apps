import { NextFunction, Request, Response } from 'express';
import {
  getBaseSitesService,
  getProductListService,
  getProductPreviewsService,
} from '../services/sap';
import { applicationInterfaceKey } from '../config';

export const getBaseSites = async (req: Request, res: Response, next: NextFunction) => {
  const { apiEndpoint } = req.installationParameters;

  try {
    const baseSitesResponse = await getBaseSitesService(apiEndpoint, applicationInterfaceKey);

    return res.status(200).send(baseSitesResponse);
  } catch (err) {
    next(err);
  }
};

export const getProductList = async (req: Request, res: Response, next: NextFunction) => {
  const urlPathParams = JSON.parse(JSON.parse(JSON.stringify(req.header('x-path-params'))));
  const { apiEndpoint, baseSites } = req.installationParameters;

  try {
    const products = await getProductListService(
      baseSites,
      apiEndpoint,
      applicationInterfaceKey,
      urlPathParams,
    );

    return res.status(200).send(products);
  } catch (err) {
    next(err);
  }
};

export const getProductPreview = async (req: Request, res: Response, next: NextFunction) => {
  const skus = JSON.parse(JSON.parse(JSON.stringify(req.header('x-skus'))));
  const { apiEndpoint } = req.installationParameters;

  try {
    const products = await getProductPreviewsService(skus, apiEndpoint, applicationInterfaceKey);

    return res.status(200).send(products);
  } catch (err) {
    next(err);
  }
};
