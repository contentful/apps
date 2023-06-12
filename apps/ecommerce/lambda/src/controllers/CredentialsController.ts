import axios, { AxiosError, AxiosResponse } from 'axios';
import { Request, Response, NextFunction, Router } from 'express';

const CredentialsController = Router();

// TODO: Refactor this so that it pulls in the headers values (shopify storefront token, storename, etc...) separately
const checkCredentials = async (
  req: Request,
  res: Response<ShopifyBuy.ShopResource | { status: 'ok' | 'error'; message: string }>,
  next: NextFunction
) => {
  try {
    if (!req.appConfig) throw new Error('App config not found');

    const proxyResourceUrl = new URL(req.appConfig.baseUrl);
    proxyResourceUrl.pathname += `/credentials`;

    try {
      let response;
      try {
        response = await axios.get(proxyResourceUrl.toString(), {
          headers: {
            'x-data-provider-parameters': JSON.stringify(req.installationParameters),
          },
        });
      } catch (error) {
        response = (error as AxiosError).response;
      } finally {
        res
          .status((response as AxiosResponse).status)
          .send(JSON.parse(JSON.stringify((response as AxiosResponse).data)));
      }
    } catch (error) {
      res.status(500).send({
        status: 'error',
        message: 'Error fetching resource',
      });
    }
  } catch (error) {
    next(error);
  }
};

CredentialsController.get('/', checkCredentials);

export default CredentialsController;
