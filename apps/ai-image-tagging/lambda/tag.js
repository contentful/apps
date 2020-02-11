'use strict';

const fetch = require('node-fetch');
const AWS = require('aws-sdk');

const IMAGES_BASE = 'https://images.ctfassets.net';

const rekog = new AWS.Rekognition();

const fetchImage = async imageUrl => {
  const res = await fetch(imageUrl);

  if (res.status === 200) {
    return res.arrayBuffer();
  } else {
    throw new Error(`Non-200 (${res.status}) response for GET ${imageUrl}.`);
  }
};

const getDetectParams = imageData => ({
  Image: { Bytes: imageData, },
  MaxLabels: 10,
  MinConfidence: 70.0
});

module.exports = async path => {
  const imageData = await fetchImage(IMAGES_BASE + path);
  const params = getDetectParams(imageData);
  const tags = await rekog.detectLabels(params).promise();

  return tags.Labels.map(label => label.Name);
}
