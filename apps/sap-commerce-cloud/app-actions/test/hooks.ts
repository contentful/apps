import sinon from 'sinon';

export const mochaHooks = {
  afterEach() {
    sinon.restore();
  },
};
