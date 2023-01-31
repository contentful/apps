import sinon from 'sinon';

const env = Object.assign({}, process.env);

export const mochaHooks = {
  beforeEach() {
    sinon.stub(console, 'error');
  },
  afterEach() {
    sinon.restore();
    process.env = env;
  },
};
