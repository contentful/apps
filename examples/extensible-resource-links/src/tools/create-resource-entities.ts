import { createResourceProvider, createResourceType } from './http';
import { movie, person, tmdb } from './imports';

const main = async () => {
  const tmdbResult = await createResourceProvider(tmdb);
  const [movieResult, personResult] = await Promise.all([
    createResourceType(movie),
    createResourceType(person)
  ]);

  console.dir(tmdbResult, { depth: 5 });
  console.dir(movieResult, { depth: 5 });
  console.dir(personResult, { depth: 5 });
};

main();
