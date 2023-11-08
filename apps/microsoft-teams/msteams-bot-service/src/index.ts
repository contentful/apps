import app from './app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`ms-teams-bot-service is listening at http://localhost:${port}`);
});
