import { Router } from 'express';
import { MagentoController } from '../controllers';
const app = Router();

app.post('/resource', MagentoController.resource);

export default app;
