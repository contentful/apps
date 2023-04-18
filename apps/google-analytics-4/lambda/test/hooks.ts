import sinon from 'sinon';

// uncomment these lines to suppress unwanted error output in testing
export const mochaHooks = {
  afterEach() {
    sinon.restore();
  },
};
