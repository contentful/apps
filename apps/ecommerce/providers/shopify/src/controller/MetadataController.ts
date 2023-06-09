import { metadata } from '../services/metadata/MetadataService';
import { Router } from 'express';
import { Request, Response } from 'express';

const MetadataController = Router();

export const getMetadata = async (req: Request, res: Response) => {
  return res.status(200).send(metadata);
};

MetadataController.get('/', getMetadata);

export default MetadataController;
