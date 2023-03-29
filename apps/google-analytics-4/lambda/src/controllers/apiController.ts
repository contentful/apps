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
      'We were unable to retrieve the private key from your service account key file. Please try reinstalling your service account key file. If the problem persists, contact support.'
    );
  }

  return serviceAccountKey;
};

const ApiController = {
  credentials: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceAccountKeyFile = req.body;
      assertServiceAccountKey(serviceAccountKeyFile);

      if (!req.serviceAccountKeyId) {
        throw new Error('Missing serviceAccountKeyId'); // set by serviceAccountKeyProvider middleware
      }

      // added to request by serviceAccountKeyProvider middleware if resolved from dynamoDB
      // TODO: DRY this up, it's also done in serviceAccountKeyProvider
      const spaceId = req.header('X-Contentful-Space-Id');
      if (!spaceId) {
        throw new Error('Missing X-Contentful-Space-Id header!');
      }

      const dynamoDB = new DynamoDBService();
      await dynamoDB.saveServiceAccountKeyFile(
        spaceId,
        req.serviceAccountKeyId,
        serviceAccountKeyFile
      );

      return res.send(200);
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
