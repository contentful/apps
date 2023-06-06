import express from 'express';
import cors from 'cors';
import MetadataController from './controller/MetadataController';
import ResourceTypeController from './controller/ResourceTypeController';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: '*',
    methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
  })
);

app.use('/', MetadataController);
app.use('/resourcesTypes', ResourceTypeController);

app.get('/ping', async (req, res) => {
  res.send('Hello World!');
});

export default app;
