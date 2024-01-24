import { expect } from 'chai';
import sinon from 'sinon';
import { parametersFromAppInstallation } from './app-installation';
import { mockAppInstallation } from '../../test/mocks';
import { AppInstallationParameters } from '../types';

describe('parametersFromAppInstallation', () => {
  it('returns the correctly typoed and formed paramaters from the app installation', () => {
    const result = parametersFromAppInstallation(mockAppInstallation);
    expect(result).to.deep.eq(mockAppInstallation.parameters);
  });
});
