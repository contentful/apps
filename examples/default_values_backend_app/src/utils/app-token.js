const JWT = require("jsonwebtoken");

const makeAppToken = (appId, privateKey, keyid) => {
  console.log(`Signing app token for app ${appId}`);
  return JWT.sign({}, privateKey, { algorithm: "RS256", issuer: appId, keyid, expiresIn: "10m" });
};

module.exports = {
  makeAppToken,
};
