import { Router } from 'express';
import { ApiController } from '../controllers';
const app = Router();

app.get('/ping', ApiController.ping);
app.post('/resource/product', ApiController.resource);
app.post('/resource/collection', ApiController.resource);

export default app;
