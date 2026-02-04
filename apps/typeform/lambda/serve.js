'use strict';

const PORT = process.env.PORT || 3001;

require('./app').listen(PORT, () => console.log(`Listening on ${PORT}...`));
