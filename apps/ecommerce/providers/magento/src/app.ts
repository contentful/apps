import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: '*',
    methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
  })
);

app.get('/api', async (req, res) => {
  res.send('Hello World!');
});

export default app;
