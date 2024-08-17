import { productTransformer, baseSiteTransformer } from './dataTransformers';

describe('dataTransformers', () => {
  describe('productTransformer', () => {
    it('transforms product data', () => {
      const apiEndpoint = 'http://localhost:9002';
      const skuIdsToSkusMap = { '123': 'product1' };
      const baseSite = 'electronics-spa';
      const item = {
        id: '123',
        images: [{ url: '/image1.jpg' }],
        code: '123',
        name: 'Product 1',
      };
      const product = productTransformer({ apiEndpoint }, skuIdsToSkusMap, baseSite)(item);
      expect(product).toEqual({
        id: '123',
        image: 'http://localhost:9002/image1.jpg',
        name: 'Product 1',
        sku: '123',
        productUrl: 'product1',
      });
    });
  });

  describe('baseSiteTransformer', () => {
    it('transforms base site data', () => {
      const item = { uid: 'electronics-spa' };
      const baseSite = baseSiteTransformer()(item);
      expect(baseSite).toEqual('electronics-spa');
    });
  });
});
