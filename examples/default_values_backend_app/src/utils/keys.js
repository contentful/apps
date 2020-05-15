const fs = require("fs");
const crypto = require("crypto");
const base64url = require("base64url");
import dotenv from 'dotenv'
dotenv.config()

const { PUBLIC_APP_KEY, PRIVATE_APP_KEY } = process.env;

const getKey = fs.readFileSync;

const getPrivateKey = () => getKey(PRIVATE_APP_KEY);
const getPublicKey = () => getKey(PUBLIC_APP_KEY);


const getKeyId = () => base64url(crypto.createHash("sha256").update(getPublicKey()).digest());

module.exports = {
  getKeyId,
  getPrivateKey,
  getPublicKey,
};
