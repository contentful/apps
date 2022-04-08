const PORT = process.env.PORT || 8000;

require('./app').listen(PORT, () => console.log(`Listening on ${PORT}...`));
