'use strict';

const fetch = jest.fn().mockResolvedValue({
  status: 200,
  arrayBuffer: jest.fn().mockResolvedValue('SOME_ARR_BUFF')
});

const documentClient = {
  update: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Attributes: {
        reqs: 7
      }
    })
  })
};

const rekog = {
  detectLabels: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Labels: [
        { Name: 'cat' },
        { Name: 'yolo' }
      ]
    })
  })
};

module.exports = {
  fetch,
  documentClient,
  rekog
};
