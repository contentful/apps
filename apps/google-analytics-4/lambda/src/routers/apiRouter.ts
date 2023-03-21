import { Router } from 'express';
import { ApiController } from '../controllers';
const app = Router();

app.post('/credentials', ApiController.credentials);
app.get('/account_summaries', ApiController.account_summaries);
app.get('/run_report', ApiController.run_report);

export default app;
