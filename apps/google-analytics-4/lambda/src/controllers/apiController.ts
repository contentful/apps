import { NextFunction, Request, Response } from 'express';
import { RunReportParamsType, ServiceAccountKeyFile } from '../types';
import { GoogleApiService } from '../services/googleApiService';
import { DynamoDBService } from '../services/dynamoDbService';
import {
  MissingServiceAccountKeyFile,
  assertServiceAccountKey,
} from '../middlewares/serviceAccountKeyProvider';

const formatArrays = (param: string | string[]) =>
  Array.isArray(param) ? param : param.split(',');

const requireServiceAccountKey = (serviceAccountKey?: ServiceAccountKeyFile) => {
  if (!serviceAccountKey) {
    throw new MissingServiceAccountKeyFile(
      'We were unable to retrieve the private key from your private key file. Please try reinstalling your private key file again. If the problem persists, contact support.'
    );
  }

  return serviceAccountKey;
};

const ApiController = {
  credentials: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceAccountKey = JSON.parse(req.body);
      assertServiceAccountKey(serviceAccountKey);

      // if record doesn't already exist for this spaceId + serviceAccountKeyId, write to dynamoDB
      if (!req.serviceAccountKey) {
        // added to request by serviceAccountKeyProvider middleware if resolved from dynamoDB
        const spaceId = req.header('X-Contentful-Space-Id');
        const sharedCredentialsId = `${spaceId}-${req.serviceAccountKeyId}`;
        const dynamoDB = new DynamoDBService();
        const data = await dynamoDB.saveSharedCredentials({
          sharedCredentialsId,
          serviceKey: serviceAccountKey,
        });
        // TODO: inspect data to validate success
        console.log('###################### data ####################', data);
        return res.status(201).json({ status: 'success' });
      }

      return res.status(200).json({ status: 'success' });
    } catch (err) {
      next(err);
    }
  },

  account_summaries: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceAccountKey = requireServiceAccountKey(req.serviceAccountKey);

      const googleApi = GoogleApiService.fromServiceAccountKeyFile(serviceAccountKey);
      const result = await googleApi.listAccountSummaries();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  run_report: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceAccountKey = requireServiceAccountKey(req.serviceAccountKey);

      const { propertyId, slug, startDate, endDate, dimensions, metrics } =
        req.query as unknown as RunReportParamsType;
      const googleApi = GoogleApiService.fromServiceAccountKeyFile(serviceAccountKey);
      const result =
        dimensions && metrics
          ? await googleApi.runReport(
              propertyId,
              slug,
              startDate,
              endDate,
              formatArrays(dimensions),
              formatArrays(metrics)
            )
          : await googleApi.runReport(propertyId, slug, startDate, endDate);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};

export default ApiController;
