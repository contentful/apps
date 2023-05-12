import { Router } from 'express';
import { MagentoController } from '../controllers';
const app = Router();

app.post('/resource', MagentoController.resource);
app.get('/config', MagentoController.config);

export default app;
