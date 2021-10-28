'use strict';

const fetch = jest.fn().mockResolvedValue({
  status: 200,
  arrayBuffer: jest.fn().mockResolvedValue('SOME_ARR_BUFF'),
});

module.exports = {
  fetch,
};
