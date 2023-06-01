import { Router } from 'express';
import { ApiController } from '../controllers';
const app = Router();

app.get('/credentials', ApiController.checkCredentials);
app.post('/resource', ApiController.resource);
app.post('/resources', ApiController.resources);
app.post('/resourcesTypes', ApiController.resourceType);

export default app;
