'use strict';

const { promisify } = require('util');

const fetch = require('node-fetch');
const AWS = require('aws-sdk');

const IMAGES_BASE = 'https://images.ctfassets.net';

const fetchImage = async imageUrl => {
  const res = await fetch(imageUrl);

  if (res.status === 200) {
    return res.arrayBuffer();
  } else {
    throw new Error(`Non-200 (${res.status}) response for GET ${imageUrl}.`);
  }
}

const getDetectParams = imageData => ({
  Image: { Bytes: imageData, },
  MaxLabels: 10,
  MinConfidence: 70.0
})

module.exports = async path => {
  const imageData = await fetchImage(IMAGES_BASE + path);

  const rekog = new AWS.Rekognition()
  const detectLabels = promisify(rekog.detectLabels.bind(rekog));
  const tags = await detectLabels(getDetectParams(imageData));

  return tags.Labels.map(label => label.Name)
}
