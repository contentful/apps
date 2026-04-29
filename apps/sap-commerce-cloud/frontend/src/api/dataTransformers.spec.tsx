import { mockProductPreview, mockBaseSite, mockApiEndpoint } from '../__mocks__';
import {
  productTransformer,
  baseSiteTransformer,
  productDetailsTransformer,
} from './dataTransformers';

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

    it('prepends apiEndpoint to relative image URLs', () => {
      const skuIdsToSkusMap = {};
      const item = {
        id: '456',
        code: 'product-code',
        name: 'Product',
        images: [{ url: '/media/image.jpg' }],
      };
      const product = productTransformer({ apiEndpoint: mockApiEndpoint }, skuIdsToSkusMap)(item);
      expect(product.image).toBe(`${mockApiEndpoint}/media/image.jpg`);
    });

    it('does not prepend apiEndpoint to absolute HTTP URLs', () => {
      const skuIdsToSkusMap = {};
      const absoluteUrl = 'https://static.test.com/media/image.jpg';
      const item = {
        id: '456',
        code: 'product-code',
        name: 'Product',
        images: [{ url: absoluteUrl }],
      };
      const product = productTransformer({ apiEndpoint: mockApiEndpoint }, skuIdsToSkusMap)(item);
      expect(product.image).toBe(absoluteUrl);
    });

    it('does not prepend apiEndpoint to absolute HTTPS URLs', () => {
      const skuIdsToSkusMap = {};
      const absoluteUrl = 'http://cdn.example.com/image.png';
      const item = {
        id: '456',
        code: 'product-code',
        name: 'Product',
        images: [{ url: absoluteUrl }],
      };
      const product = productTransformer({ apiEndpoint: mockApiEndpoint }, skuIdsToSkusMap)(item);
      expect(product.image).toBe(absoluteUrl);
    });

    it('handles empty image URLs', () => {
      const skuIdsToSkusMap = {};
      const item = {
        id: '456',
        code: 'product-code',
        name: 'Product',
        images: [{ url: '' }],
      };
      const product = productTransformer({ apiEndpoint: mockApiEndpoint }, skuIdsToSkusMap)(item);
      expect(product.image).toBe('');
    });
  });

  describe('productDetailsTransformer', () => {
    it('prepends apiEndpoint to relative image URLs', () => {
      const item = {
        id: '789',
        code: 'product-code',
        name: 'Product Details',
        images: [{ url: '/media/detail-image.jpg' }],
      };
      const product = productDetailsTransformer({ apiEndpoint: mockApiEndpoint })(item);
      expect(product.image).toBe(`${mockApiEndpoint}/media/detail-image.jpg`);
    });

    it('does not prepend apiEndpoint to absolute HTTPS URLs', () => {
      const absoluteUrl = 'https://cdn.example.com/detail.jpg';
      const item = {
        id: '789',
        code: 'product-code',
        name: 'Product Details',
        images: [{ url: absoluteUrl }],
      };
      const product = productDetailsTransformer({ apiEndpoint: mockApiEndpoint })(item);
      expect(product.image).toBe(absoluteUrl);
    });

    it('does not prepend apiEndpoint to absolute HTTP URLs', () => {
      const absoluteUrl = 'http://static.example.com/image.png';
      const item = {
        id: '789',
        code: 'product-code',
        name: 'Product Details',
        images: [{ url: absoluteUrl }],
      };
      const product = productDetailsTransformer({ apiEndpoint: mockApiEndpoint })(item);
      expect(product.image).toBe(absoluteUrl);
    });

    it('handles empty image URLs', () => {
      const item = {
        id: '789',
        code: 'product-code',
        name: 'Product Details',
        images: [{ url: '' }],
      };
      const product = productDetailsTransformer({ apiEndpoint: mockApiEndpoint })(item);
      expect(product.image).toBe('');
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
