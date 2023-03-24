import { DynamoDBService } from '../src/services/dynamoDbService';
import sinon from 'sinon';
import { validServiceAccountKeyFile } from './mocks/googleApi';

// uncomment these lines to suppress unwanted error output in testing
export const mochaHooks = {
  beforeEach() {
    sinon
      .stub(DynamoDBService.prototype, 'getServiceAccountKeyFile')
      .resolves(validServiceAccountKeyFile);
  },
  afterEach() {
    sinon.restore();
  },
};
