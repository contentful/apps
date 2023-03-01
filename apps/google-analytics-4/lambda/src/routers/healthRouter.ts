import { Router } from 'express';
import { HealthController } from '../controllers';
const app = Router();

app.get('/', HealthController.status);

export default app;
