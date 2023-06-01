import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import Sinon from 'sinon';
import axios from 'axios';
import ApiController from './apiController';
import { Request, Response } from 'express';
import { ExternalResource } from '../types';
import { mockResourceLink } from '../mocks/resourceLink.mock';

const sandbox = Sinon.createSandbox();
chai.use(chaiHttp);
chai.should();

describe('API Controller', () => {
  let stub: Sinon.SinonStub;
  const next = sandbox.stub();

  beforeEach((done) => {
    sandbox.stub(NodeAppsToolkit, 'verifyRequest').get(() => {
      return () => true;
    });
    stub = sandbox.stub(axios, 'post');
    done();
  });

  afterEach((done) => {
    sandbox.restore();
    done();
  });

  describe('resource', () => {
    const body = mockResourceLink;
    const installationParameters = {
      param1: 'param1',
    };
    const request = {
      body,
      appConfig: {
        baseUrl: 'https://example.com/test/example',
      },
      installationParameters,
    } as unknown as Request;

    it('makes a POST to the proxy resource URL', (done) => {
      ApiController.resource(
        request,
        {} as Response<ExternalResource | { status: 'ok' | 'error'; message: string }>,
        next
      );
      expect(
        stub.calledWith('https://example.com/test/example/resource', body, {
          headers: {
            'x-data-provider-parameters': JSON.stringify(installationParameters),
          },
        })
      ).to.be.true;
      done();
    });
  });
});
