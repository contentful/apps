import { createResourceProvider, createResourceType } from './http';
import { mockshop, product } from './imports';

const main = async () => {
  const mockshopResult = await createResourceProvider(mockshop);
  const [productResult] = await Promise.all([createResourceType(product)]);

  console.dir(mockshopResult, { depth: 5 });
  console.dir(productResult, { depth: 5 });
};

main();
