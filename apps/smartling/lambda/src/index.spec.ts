// @ts-nocheck
import * as request from 'supertest';
import { makeApp } from './index';

const fetchMock = jest.fn(() => {
  return Promise.resolve({
    status: 201,
    async json() {
      return {
        response: {
          data: 'foo'
        }
      };
    }
  });
});

class Client {
  clientId: string;
  clientSecret: string;
  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  callbackParams() {
    return { code: '1234' };
  }

  async callback() {
    return {
      access_token: 'access-123',
      refresh_token: 'refresh_token-123'
    };
  }

  async refresh(token: string) {
    if (token === 'good-123') {
      return {
        access_token: 'access-123'
      };
    } else if (token === 'invalid-123') {
      const e = new Error('Invalid grant');

      // @ts-ignore
      e.error = 'invalid_grant';

      throw e;
    }

    throw new Error('General');
  }
}
const issuerMock = {
  async discover() {
    return { Client };
  }
};

const app = makeApp(fetchMock, issuerMock);

describe('server', () => {
  process.env.CLIENT_ID = 'clientId-123';
  process.env.CLIENT_SECRET = 'secret-123';

  afterAll(() => {
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  });

  it('should redirect correctly for /openauth', done => {
    request(app)
      .get('/openauth')
      .expect(
        'Location',
        'https://sso.smartling.com/auth/realms/Smartling/protocol/openid-connect/auth?response_type=code&client_id=clientId-123'
      )
      .expect(302, e => done(e));
  });

  it('should serve the frontend', done => {
    request(app)
      .get('/frontend')
      .expect(301, e => done(e));
  });

  it('should serve the main root and give an error for no code', done => {
    request(app)
      .get('/')
      .expect(
        'Location',
        '/frontend/index.html?error=No%20code%20was%20provided%20during%20OAuth%20handshake.'
      )
      .expect(302, e => done(e));
  });

  it('should produce a redirect with access_token', done => {
    request(app)
      .get('/?code=1234')
      .expect(
        'Location',
        '/frontend/index.html?access_token=access-123&refresh_token=refresh_token-123'
      )
      .expect(302, e => done(e));
  });

  it('should give 400 if no refresh token is provided', done => {
    request(app)
      .get('/refresh')
      .expect(400, e => done(e));
  });

  it('should give a 401 on invalid grants', done => {
    request(app)
      .get('/refresh?refresh_token=invalid-123')
      .expect(401, e => done(e));
  });

  it('should give a 500 on general refresh error', done => {
    request(app)
      .get('/refresh?refresh_token=bad-123')
      .expect(500, e => done(e));
  });

  it('should give a 500 on general refresh error', done => {
    request(app)
      .get('/refresh?refresh_token=bad-123')
      .expect(500, e => done(e));
  });

  it('should response with a new access token on valid refresh', done => {
    request(app)
      .get('/refresh?refresh_token=good-123')
      .expect(200, e => done(e));
  });

  it('should response with the Smartling entry response on /entry', done => {
    request(app)
      .get('/entry?projectId=project-1&spaceId=space-1&entryId=entry-1')
      .expect(201, (err, res) => {
        expect(res.body).toEqual({ data: 'foo' });
        done(err);
      });
  });
});
