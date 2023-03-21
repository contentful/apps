// import sinon from 'sinon';
//

import { DynamoDBService } from '../src/services/dynamoDbService';
import sinon from 'sinon';
import { validServiceAccountKeyFile } from './mocks/googleApi';

// uncomment these lines to suppress unwanted error output in testing
export const mochaHooks = {
  beforeEach() {
    // sinon.stub(console, 'error');
    sinon
      .stub(DynamoDBService.prototype, 'getSharedCredentials')
      .resolves(validServiceAccountKeyFile);
  },
  afterEach() {
    sinon.restore();
  },
};
