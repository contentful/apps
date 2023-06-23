import express from 'express';
import cors from 'cors';
import SAPController from './controller/SAPController';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: '*',
    methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
  })
);

app.use('/sap', SAPController);

app.get('/ping', async (req, res) => {
  res.send('Hello World!');
});

export default app;
