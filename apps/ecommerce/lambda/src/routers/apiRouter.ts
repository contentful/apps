import { Router } from 'express';
import { ApiController } from '../controllers';
const app = Router();

app.get('/ping', ApiController.ping);
app.get('/product/:id', ApiController.product);

export default app;
