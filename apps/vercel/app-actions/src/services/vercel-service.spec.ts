import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { VercelService } from './vercel-service';
import { makeMockFetchResponse, mockVercelProject } from '../../test/mocks';

chai.use(sinonChai);

describe('VercelService', () => {
  const vercelAccessToken = 'vercel-access-token';
  const vercelProjectId = 'vercel-project-id';
  const vercelTeamId = 'vercel-team-id';
  const vercelService = new VercelService(vercelAccessToken, vercelTeamId);
  let stubbedFetch: sinon.SinonStub;

  beforeEach(() => {
    const mockFetchResponse = makeMockFetchResponse(mockVercelProject);
    stubbedFetch = sinon.stub(global, 'fetch');
    stubbedFetch.resolves(mockFetchResponse);
  });

  describe('#getProject', () => {
    it('returns the correct url', async () => {
      const result = await vercelService.getProject(vercelProjectId);
      expect(result).to.deep.eq(mockVercelProject);
    });

    it('calls fetch with the appropriate values', async () => {
      await vercelService.getProject(vercelProjectId);
      expect(stubbedFetch).to.have.been.calledWith(
        'https://api.vercel.com/v9/projects/vercel-project-id?teamId=vercel-team-id',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer vercel-access-token',
          },
        }
      );
    });

    describe('when error status (non-200) is received', () => {
      beforeEach(() => {
        const mockFetchResponse = makeMockFetchResponse(mockVercelProject, {}, 500);
        sinon.restore();
        stubbedFetch = sinon.stub(global, 'fetch');
        stubbedFetch.resolves(mockFetchResponse);
      });

      it('throws an an error', async () => {
        let error: any;
        try {
          await vercelService.getProject(vercelProjectId);
        } catch (e) {
          error = e;
        }
        expect(error).to.be.an('Error');
      });
    });
  });
});
