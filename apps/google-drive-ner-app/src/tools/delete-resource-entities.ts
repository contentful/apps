import { deleteResourceProvider, deleteResourceType } from './http';
import { file } from './imports';

const main = async () => {
  const [fileResourceType] = await Promise.all([deleteResourceType(file)]);
  const resourceProvider = await deleteResourceProvider();

  console.dir(resourceProvider, { depth: 5 });
  console.dir(fileResourceType, { depth: 5 });
};

main();
