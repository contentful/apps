import { getResourceProvider, listResourceTypes } from './http';

const main = async () => {
  const resourceProvider = await getResourceProvider();
  const resourceTypes = await listResourceTypes();

  console.dir(resourceProvider, { depth: 5 });
  console.dir(resourceTypes, { depth: 5 });
};

main();
