import { Router } from 'express';
import { ShopifyController } from '../controllers';
const app = Router();

app.post('/resource', ShopifyController.resource);

export default app;
