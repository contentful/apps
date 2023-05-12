import { Router } from 'express';
import { ShopifyController } from '../controllers';
const app = Router();

app.post('/resource', ShopifyController.resource);
app.post('/healthcheck', ShopifyController.healthcheck);

export default app;
