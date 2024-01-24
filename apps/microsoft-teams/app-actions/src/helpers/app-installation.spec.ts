import { expect } from 'chai';
import { parametersFromAppInstallation } from './app-installation';
import { mockAppInstallation } from '../../test/mocks';

describe('parametersFromAppInstallation', () => {
  it('returns the correctly typed and formed paramaters from the app installation', () => {
    const result = parametersFromAppInstallation(mockAppInstallation);
    expect(result).to.deep.eq(mockAppInstallation.parameters);
  });
});
