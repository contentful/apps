import { Router } from 'express';
import { ApiController } from '../controllers';
const app = Router();

app.get('/ping', ApiController.ping);
app.post('/resource', ApiController.resource);

export default app;
