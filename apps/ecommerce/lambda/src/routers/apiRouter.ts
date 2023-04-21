import { Router } from 'express';
import { ApiController } from '../controllers';
const app = Router();

app.get('/ping', ApiController.ping);

export default app;
