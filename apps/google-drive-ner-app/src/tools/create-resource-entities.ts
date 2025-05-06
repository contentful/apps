import { createResourceProvider, createResourceType } from './http';
import { file, googleDrive } from './imports';

const main = async () => {
  const mockshopResult = await createResourceProvider(googleDrive);
  const [fileResult] = await Promise.all([createResourceType(file)]);

  console.dir(mockshopResult, { depth: 5 });
  console.dir(fileResult, { depth: 5 });
};

main();
