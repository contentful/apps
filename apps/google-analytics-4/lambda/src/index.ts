import app from './app';

const port = 3000;

app.listen(port, () => {
  return console.log(`Express server is listening at http://localhost:${port}`);
});
