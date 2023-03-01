import { Request, Response } from 'express';

const HealthController = {
  status: (_req: Request, res: Response) => {
    // TODO: add health check logic
    // - check that Contentful APIs are available
    // - check that Google APIs are available
    // - check that service key lookup is working
    return res.status(204).send();
  },
};

export default HealthController;
