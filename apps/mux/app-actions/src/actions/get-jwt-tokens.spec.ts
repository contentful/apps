import { expect } from 'chai';
import sinon from 'sinon';
import { makeMockAppActionCallContext } from '../../test/mocks';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { handler } from './get-jwt-tokens';
import { AppActionCallResponseSuccess, SignedUrlTokens } from '../types';

const parseJwt = (token: string) => {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
};

const mapParsedValues = (obj: SignedUrlTokens): Record<string, any> => {
  // iterate over the obj, parse each of the values, and return the object back with the same keys and parsed value
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, parseJwt(v)]));
};

describe('get-signed-url-tokens.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;

  const playbackId = 'playbackId';
  const parameters = { playbackId };
  const appInstallationParameters = {
    // these test values were derived from an actual signing key issued by mux
    // note: the keys are intentionally included here in plaintext but are not operational
    muxEnableSignedUrls: true,
    muxSigningKeyId: 'F57REGMS9OMS7VBU002nmPP1x6wloRfKuOeS7TPcg8qk',
    muxSigningKeyPrivate:
      'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBcjgvK2pXdGdLc1NiTXBIYmovVnJTbkhLNkxHLzlObW9mS1J4TWgvbG0zVVpZMjA2CktHLy91QXlBRWVSZzVDYTdURVZueGpGVlNXTmhpTlZsbDdzOW91aFE3V2RGa3g4Uk1lTEFTU3NZZ0g4NGdVWVoKQzI4Uy9nTHlNOVBkWFdjeTVEa0Y1bkJjT3JoQWZoN3lwN01LQndvZEZaVnhsbVhxbU9adlBTb3c5YnovYjFhSgpRcEtURm1xSXcrVVREWWZLSmk3OUFUMDYxbXVlNXlZbEVzQm9LZU9VYkdaaTh1eDZWZTlmMzQvNXEyeFhsZEVqClAyNU0xclRkQnVacVh2N0xrNTlncllzVG03TVZQOGtpYnorRnEyY051TE8vbFVWT2hxazg4bjliNEVxNHV0Sk0KM0k1K2o3QnlJNGtGQUtsYUNvL2tRcFNvaXVuaXQzQ29WTEkvZHdJREFRQUJBb0lCQUdBQVNWVmJqcFdMNmRzQgpQazByaTd5SXltMnBzZEcza0lNUElDaG90bTNlMFZBemNwQm1KOUtPTU5pVVJqd08wak5ocXJyVWNXZXpkcXpMCktjQmlvOU55MjgzbW1GMHZsNm9QMFVPaTNxdzd5OVQ3TysyOFp6aUF6MVJ4bWV6SXowZER3KzhDNTduQXBxYTMKcTNUYkZOeW5MeDU4RGh3NzVwQTdNLzdJTFJmaGhZemtTVi9oMVhsQWlVWFZCQTl4ZlJiUE9seVJrTERqL1pZTwpMSlpvbzVVZ1ZHTkxFWWkzWEU4djlLeW1VVHZpS2R0NUpXK0RWdFBEUDZFT3BBenVnUWR6OHVkWkRON3VWYVQ4Clg4SEU2Yzh3TDNqdVhrc0F2QVgyZ1FtWUFHdlNKY3oyYy9adVRuQlI4SmVVUnpac2RGNGkxWlA1SEMraFBBZTgKTmU3eWhTRUNnWUVBNVZQdGNoRFRmOVFlZEE4bjRqamhUYjVEeTFyb2x2dDVRRGpkQkVlMytJbXVmZEZxS3VvTgpxdWwyajB1SHhsMXNCZDZsM1NwRGdZK25EWGVEMWUxOUExWVFaVWRaTjJIOVJpYmgxaE1vdzg1VkpQcU9Ld1BXCmpuTXNHdHo0WEhiQ0szMFd2dmZFSnlHUjErOGRyZHNYWVA2NC9lbGdMV0RoUGViTmRFbmJaUmtDZ1lFQXhFS3YKWlFaUXIxZnhxMk0yMFUvaDBIelZiSmplTmJOSU9YQkxRVm91eDVNRVJuNmFmb3JjSFBjWDJ2bXRsK0lrbmx5MgpGemkrYWY2WjlIRXFpMjdRTDdKWGZ2SDl6eEFZbFE2N0hMT0FaQkI1M0c0MmxUc1JDMjF5KzJ6V1VTMzMyY2J3CkF5MnJjaWJTM2hGTmsxeHRPZUh3YlE5WWtCclFvaDVJQm9JaFN3OENnWUJNSzd4S2p0d3hNVHVNUVJ4MlAzNVcKWEVRWVgzR3g5SVVwbDdtUm1tQzQ1TUpZZUI1VGNycG5jblEyMUZlY3c1c0Z1QlpQaDZJMGZvcDJKcVJiZ2k1cgoxVUpNNFkzNG4wdUk2WkZKa2NPUWhoQXg0Q2Nva25YSml1ZXpaSUg1OUZnNkthcE1jKzlyTC9OSlRkc0Z6Q2ZQCng4dWFTdEh2UUthUDhRRjlCcXNnd1FLQmdHZE03a0xQYXlLUHVJMU1RR3MxajVjTVRjM0dQSmVwVU9laXVvbWcKYlNUd3RmeGc0UEtnSmpFOHdacXBkbnlPTkZZQ1dIbXFqVmIvQW92T0VPV3BJdjBuOHJQSHJaOFNTczRTSGR5QwpncDZvcVd1anV5a2JHT0taN2o1MlQrd1V0UE0wcWRvU2JMNDl2eG5SbzdKZm9NSXBzVUhHSlFoY2hObi85RXN3CnJWTnpBb0dBRnpyUWk5emZ6d2pPajNBeUIxcmpVWmRvMUNXbTM0NytubEl6MnRMTDV0NWFUa2dvSHIveFl5cUsKbVRvaGhRemtHTUVtakJIZ2JPRGxiQWp6TGNQY1h5WFVGSkVWcnBUOHRRSEZWdjVZTDFPcGRhWnNMV2UwM1ZlNgpUYlhQN1MvUkI1cURONkRlV0dIMHZQUEw5WWNnQVRYYjJ0Snc3Nm0xNkFpSnR4eVhZelk9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg==',
  };
  const cmaClientMockResponses: [AppInstallationProps] = [
    {
      sys: {
        type: 'AppInstallation',
        appDefinition: {} as SysLink,
        environment: {} as SysLink,
        space: {} as SysLink,
        version: 1,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      parameters: appInstallationParameters,
    },
  ];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('returns a valid set of tokens', async () => {
    const result = await handler(parameters, context);
    expect(result).to.have.property('ok', true);

    const { playbackToken, posterToken, storyboardToken } = mapParsedValues(
      (result as AppActionCallResponseSuccess<SignedUrlTokens>).data
    );

    expect(playbackToken).to.have.property('sub', playbackId);
    expect(playbackToken).to.have.property('aud', 'v');
    expect(posterToken).to.have.property('sub', playbackId);
    expect(posterToken).to.have.property('aud', 't');
    expect(storyboardToken).to.have.property('sub', playbackId);
    expect(storyboardToken).to.have.property('aud', 's');
  });

  describe('when mux signed urls is not enabled', () => {
    beforeEach(() => {
      context = makeMockAppActionCallContext(
        [
          {
            ...cmaClientMockResponses,
            parameters: { ...appInstallationParameters, muxEnableSignedUrls: false },
          },
        ],
        cmaRequestStub
      );
    });
  });
});
