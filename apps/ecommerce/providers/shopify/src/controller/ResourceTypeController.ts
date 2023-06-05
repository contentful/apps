import { Router } from 'express';
import { Request, Response } from 'express';

const ResourceTypeController = Router();

const ping = async (req: Request, res: Response) => {
  return res.status(200).send('healthy!');
};

const getResourceType = async (req: Request, res: Response) => {
  return res.status(200).send('getResourceType call successful');
};

const getResourceTypeSchema = async (req: Request, res: Response) => {
  return res.status(200).send('getResourceTypeSchema call successful');
};

const getResources = async (req: Request, res: Response) => {
  return res.status(200).send('getResources call successful');
};

const getOneResource = async (req: Request, res: Response) => {
  return res.status(200).send('getOneResource call successful');
};

ResourceTypeController.get('/', ping);
ResourceTypeController.get('/:resourceType', getResourceType);
ResourceTypeController.get('/:resourceType/schema', getResourceTypeSchema);
ResourceTypeController.get('/:resourceType/resources', getResources);
ResourceTypeController.get('/:resourceType/resources/:resourceId', getOneResource);

export default ResourceTypeController;
