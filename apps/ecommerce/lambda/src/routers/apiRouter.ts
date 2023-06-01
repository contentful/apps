import { Router } from 'express';
import { ApiController } from '../controllers';
const app = Router();

app.get('/credentials', ApiController.checkCredentials);
app.post('/resource', ApiController.resource);

export default app;
