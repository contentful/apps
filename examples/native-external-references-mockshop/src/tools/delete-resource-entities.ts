import { deleteResourceProvider, deleteResourceType } from './http';
import { product } from './imports';

const main = async () => {
  const [productResourceType] = await Promise.all([deleteResourceType(product)]);
  const resourceProvider = await deleteResourceProvider();

  console.dir(resourceProvider, { depth: 5 });
  console.dir(productResourceType, { depth: 5 });
};

main();
