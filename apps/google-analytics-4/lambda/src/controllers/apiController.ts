import { NextFunction, Request, Response } from 'express';
import { RunReportParamsType } from '../types';
import { GoogleApiService } from '../services/googleApiService';
// import { DynamoDBService } from '../services/dynamoDbService';

const formatArrays = (param: string | string[]) =>
  Array.isArray(param) ? param : param.split(',');

const ApiController = {
  credentials: (_req: Request, res: Response) => {
    // TODO: actually verify the credentials
    res.status(200).json({ status: 'active' });
  },

  account_summaries: async (req: Request, res: Response, next: NextFunction) => {
    // TODO: Add actual logic for lazy getting credentials TBD example usage below
    // const dynamoDB = new DynamoDBService();
    // const spaceId = req.get('x-contentful-space-id');
    // const sharedCredentialsId = `${spaceId}-${req.serviceAccountKeyId?.id!}`;

    // const sharedCredentials = await dynamoDB.getSharedCredentials({
    //   sharedCredentialsId,
    // });

    // if (!sharedCredentials) {
    //   const data = await dynamoDB.saveSharedCredentials({
    //     sharedCredentialsId,
    //     serviceKey: req.serviceAccountKey!,
    //   });
    //   console.log({ data });
    // } else {
    //   console.log({ sharedCredentials });
    // }

    try {
      const serviceAccountKeyFile = req.serviceAccountKey;

      if (serviceAccountKeyFile === undefined) {
        // intentional runtime error because the middleware already handles this. typescript
        // just doesn't realize
        throw new Error('missing service account key value');
      }

      const googleApi = GoogleApiService.fromServiceAccountKeyFile(serviceAccountKeyFile);
      const result = await googleApi.listAccountSummaries();
      res.status(200).json(result);
    } catch (err) {
      // pass to apiErrorHandler
      next(err);
    }
  },

  run_report: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceAccountKeyFile = req.serviceAccountKey;
      const { propertyId, slug, startDate, endDate, dimensions, metrics } =
        req.query as unknown as RunReportParamsType;

      // intentional runtime error because the middleware already handles this. typescript
      // just doesn't realize
      if (serviceAccountKeyFile === undefined) throw new Error('missing service account key value');

      const googleApi = GoogleApiService.fromServiceAccountKeyFile(serviceAccountKeyFile);
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
      // pass to apiErrorHandler
      next(err);
    }
  },
};

export default ApiController;
