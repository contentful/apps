import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { VercelService } from './vercel-service';
import { makeMockFetchResponse, mockVercelProject } from '../../test/mocks';

chai.use(sinonChai);

describe('VercelService', () => {
  const vercelAccessToken = 'vercel-access-token';
  const vercelProjectId = 'vercel-project-id';
  const vercelService = new VercelService(vercelAccessToken);
  let stubbedFetch: sinon.SinonStub;

  beforeEach(() => {
    const mockFetchResponse = makeMockFetchResponse(mockVercelProject);
    stubbedFetch = sinon.stub(global, 'fetch');
    stubbedFetch.resolves(mockFetchResponse);
  });

  describe('#getTargetProductionUrl', () => {
    it('returns the correct url', async () => {
      const result = await vercelService.getTargetProductionUrl(vercelProjectId);
      expect(result).to.eq('team-integrations-vercel-playground-gqmys2z3c.vercel.app');
    });

    it('calls fetch with the appropriate values', async () => {
      await vercelService.getTargetProductionUrl(vercelProjectId);
      expect(stubbedFetch).to.have.been.calledWith(
        'https://api.vercel.com/v10/projects/vercel-project-id',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer vercel-access-token',
          },
        }
      );
    });
  });

  // TODO write tests for actual implementation
  it('returns ');
});
