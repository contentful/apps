import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { mockResourceLink } from '../mocks/resourceLink.mock';
import Sinon from 'sinon';
import Client, {
  CheckoutResource,
  CollectionResource,
  ImageResource,
  Product,
  ProductResource,
  Shop,
  ShopResource,
} from 'shopify-buy';

const sandbox = Sinon.createSandbox();
chai.use(chaiHttp);
chai.should();

const shopifyClientStub = {
  product: {
    fetch: () =>
      Sinon.promise((resolve) => {
        return resolve({
          title: 'Some Product title',
          description: 'Some product description',
          images: [{ url: 'some-product-url' }],
        } as Product);
      }),
    fetchAll: () => Sinon.promise(Sinon.spy()),
    fetchMultiple: () => Sinon.promise(Sinon.spy()),
    fetchByHandle: () => Sinon.promise(Sinon.spy()),
    fetchQuery: () => Sinon.promise(Sinon.spy()),
    fetchRecommendations: () => Sinon.promise(Sinon.spy()),
    graphQLClient: null,
  } as ProductResource,
  collection: {} as CollectionResource,
  checkout: {} as CheckoutResource,
  image: {} as ImageResource,
  shop: {
    fetchInfo: () => {
      return Sinon.promise((resolve) => {
        return resolve({
          id: 'some-shop-id',
          name: 'some test shop name',
        } as Shop);
      });
    },
    fetchPolicies: () => Sinon.promise(Sinon.spy()),
    graphQLClient: null,
  } as ShopResource,
  graphQLClient: null,
  fetchNextPage: function <T extends Client.Node>(): Promise<T[]> {
    throw new Error('Function not implemented.');
  },
};

const stubDomain = 'mytest-domain.myshopify.com';

describe('Shopify Router', () => {
  beforeEach((done) => {
    sandbox.stub(NodeAppsToolkit, 'verifyRequest').get(() => {
      return () => true;
    });
    done();
  });

  afterEach((done) => {
    sandbox.restore();
    done();
  });

  describe('When sending a healthcheck', () => {
    it('should reply with store data', (done) => {
      sandbox.stub(Client, 'buildClient').returns(shopifyClientStub);
      chai
        .request(app)
        .post('/shopify/healthcheck')
        .set('X-Contentful-Data-Provider', 'shopify')
        .set('x-contentful-shopify-domain', stubDomain)
        .send({ sys: mockResourceLink.sys })
        .end((error, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name');
          done();
        });
    });
  });

  describe('When requesting a resource', () => {
    it('should reply with Shopify resource when id is valid', (done) => {
      sandbox.stub(Client, 'buildClient').returns(shopifyClientStub);
      chai
        .request(app)
        .post('/shopify/resource')
        .set('X-Contentful-Data-Provider', 'shopify')
        .set('x-contentful-shopify-domain', stubDomain)
        .send({ sys: mockResourceLink.sys })
        .end((error, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('description');
          done();
        });
    });
    it('shows an error message when id is invalid', (done) => {
      sandbox.stub(Client, 'buildClient').returns({
        ...shopifyClientStub,
        product: {
          fetch: () =>
            Sinon.promise((resolve) => {
              return resolve(null);
            }),
        } as unknown as ProductResource,
      });
      chai
        .request(app)
        .post('/shopify/resource')
        .set('X-Contentful-Data-Provider', 'shopify')
        .set('x-contentful-shopify-domain', stubDomain)
        .send({ sys: mockResourceLink.sys })
        .end((error, res) => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.match(/Product Not Found/);
          done();
        });
    });
  });
});
