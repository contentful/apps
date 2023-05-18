import { Request, Response } from 'express';
import { ErrorResponse, ExternalResource, ExternalResourceLink } from '../types';
import { mockExternalResource } from '../mocks/resourceData.mock';

const MagentoController = {
  resource: (
    req: Request<ExternalResourceLink>,
    res: Response<ExternalResource | ErrorResponse>
  ): Response<ExternalResource> => {
    if (req.body.sys.urn.match(/\/not_found$/)) {
      return res.status(404).send({
        status: 'error',
        message: 'Not found',
      });
    } else if (req.body.sys.urn.match(/\/bad_request$/)) {
      return res.status(400).send({
        status: 'error',
        message: 'Bad request',
      });
    }

    return res.send(mockExternalResource);
  },
};

export default MagentoController;
