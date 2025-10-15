import { AppInstallationProps, SysLink } from 'contentful-management';
import { fetchTenantId } from './utils';
import sinon from 'sinon';
import { makeMockPlainClient } from '../test/mocks';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('fetchTenantId', () => {
  const cmaStub = sinon.stub();
  const tenantId = 'msteams-tenant-id';

  const mockAppInstallation: AppInstallationProps = {
    sys: {
      type: 'AppInstallation',
      appDefinition: {} as SysLink,
      environment: {} as SysLink,
      space: {} as SysLink,
      organization: {} as SysLink,
      createdAt: 'createdAt',
      version: 1,
      updatedAt: 'updatedAt',
    },
    parameters: {
      tenantId: tenantId,
    },
  };
  const cma = makeMockPlainClient([mockAppInstallation], cmaStub);
  const appInstallationId = 'appInstallationId';

  it('returns the tenant id', async () => {
    const result = await fetchTenantId(cma, appInstallationId);
    expect(cmaStub).to.have.been.calledWithMatch({
      entityType: 'AppInstallation',
      action: 'get',
    });
    expect(result).to.eq(tenantId);
  });
});
