import { Router } from 'express';
import { ApiController, ShopifyController } from '../controllers';
const app = Router();

app.get('/ping', ApiController.ping);
app.post('/resource/:resourceType/:id', ApiController.resource);

export default app;
