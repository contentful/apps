import { mockProductPreview, mockBaseSite, mockApiEndpoint } from '../__mocks__';
import { productTransformer, baseSiteTransformer } from './dataTransformers';

describe('dataTransformers', () => {
  describe('productTransformer', () => {
    it('transforms product data', () => {
      const skuIdsToSkusMap = { '123': 'product1' };
      const product = productTransformer(
        { apiEndpoint: mockApiEndpoint },
        skuIdsToSkusMap,
        mockBaseSite
      )(mockProductPreview);
      expect(product).toEqual({
        id: '123',
        image: mockProductPreview.image,
        name: mockProductPreview.name,
        sku: '',
        productUrl: 'localhost:9002/occ/v2/electronics-spa/products/',
      });
    });
  });

  describe('baseSiteTransformer', () => {
    it('transforms base site data', () => {
      const item = { uid: mockBaseSite };
      const baseSite = baseSiteTransformer()(item);
      expect(baseSite).toEqual(mockBaseSite);
    });
  });
});
