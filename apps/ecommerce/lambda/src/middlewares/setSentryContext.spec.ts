import * as Sentry from '@sentry/node';
import express from 'express';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { setSentryContext } from './setSentryContext';
import { config } from '../config';

describe('setSentryContext', () => {
  chai.use(chaiHttp);
  const app = express();

  Sentry.init({
    dsn: config.sentryDSN,
    environment: config.environment,
  });

  app.use(setSentryContext);

  app.get('/test', (_req, res) => {
    res.send('ok');
  });

  it('should set the sentry tags', async () => {
    await chai
      .request(app)
      .get('/test')
      .set('X-Contentful-Not-Contentful-Context-Header', 'testNotContentfulContextHeader')
      .set('X-Contentful-App', 'testApp')
      .set('X-Contentful-ContentType', 'testContentType')
      .set('X-Contentful-Entry', 'testEntry')
      .set('X-Contentful-Environment', 'testEnvironment')
      .set('X-Contentful-EnvironmentAlias', 'testEnvironmentAlias')
      .set('X-Contentful-Field', 'testField')
      .set('X-Contentful-Location', 'testLocation')
      .set('X-Contentful-Organization', 'testOrganization')
      .set('X-Contentful-Space', 'testSpace')
      .set('X-Contentful-User', 'testUser');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scope = Sentry.getCurrentHub().getScope() as any;

    expect(Object.keys(scope._tags)).to.not.include('X-Contentful-Not-Contentful-Context-Header');
    expect(scope._tags['X-Contentful-App']).to.eq('testApp');
    expect(scope._tags['X-Contentful-ContentType']).to.eq('testContentType');
    expect(scope._tags['X-Contentful-Entry']).to.eq('testEntry');
    expect(scope._tags['X-Contentful-Environment']).to.eq('testEnvironment');
    expect(scope._tags['X-Contentful-EnvironmentAlias']).to.eq('testEnvironmentAlias');
    expect(scope._tags['X-Contentful-Field']).to.eq('testField');
    expect(scope._tags['X-Contentful-Location']).to.eq('testLocation');
    expect(scope._tags['X-Contentful-Organization']).to.eq('testOrganization');
    expect(scope._tags['X-Contentful-Space']).to.eq('testSpace');
    expect(scope._tags['X-Contentful-User']).to.eq('testUser');
    expect(Object.keys(scope._tags)).to.eql([
      'X-Contentful-App',
      'X-Contentful-ContentType',
      'X-Contentful-Entry',
      'X-Contentful-Environment',
      'X-Contentful-EnvironmentAlias',
      'X-Contentful-Field',
      'X-Contentful-Location',
      'X-Contentful-Organization',
      'X-Contentful-Space',
      'X-Contentful-User',
    ]);
  });
});
