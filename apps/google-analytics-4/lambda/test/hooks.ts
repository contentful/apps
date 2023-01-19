import sinon from 'sinon';

export const mochaHooks = {
  beforeEach() {
    sinon.stub(console, 'error');
  },
  afterEach() {
    sinon.restore();
  },
};
