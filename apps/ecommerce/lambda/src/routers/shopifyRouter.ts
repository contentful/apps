import { Router } from 'express';
import { ShopifyController } from '../controllers';
const app = Router();

app.get('/credentials', ShopifyController.checkCredentials);
app.post('/resource', ShopifyController.resource);
app.post('/resources', ShopifyController.resources);
app.get('/resourcesTypes', ShopifyController.getShopifyResourceTypes);

export default app;
