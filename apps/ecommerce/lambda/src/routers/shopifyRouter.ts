import { Router } from 'express';
import { ShopifyController } from '../controllers';
const app = Router();

app.get('/credentials', ShopifyController.checkCredentials);
app.post('/resource', ShopifyController.resource);

export default app;
