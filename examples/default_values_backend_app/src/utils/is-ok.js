module.exports = {
  isOk(statusCode) {
    const status = Number.parseInt(statusCode, 10);
    return status < 400 && status > 99;
  },
};
