import { Request, Response } from 'express';
import { CombinedResource, ErrorResponse, ExternalResourceLink } from '../types';
import { mockResourceData } from '../mocks/resourceData.mock';

const MagentoController = {
  resource: (
    req: Request<ExternalResourceLink>,
    res: Response<CombinedResource | ErrorResponse>
  ): Response<CombinedResource> => {
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

    return res.send({
      sys: req.body.sys,
      ...mockResourceData,
    });
  },
};

export default MagentoController;
