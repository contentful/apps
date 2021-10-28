'use strict';

const IMAGES_BASE = 'https://images.ctfassets.net';

const fetchImage = async (imageUrl, fetch) => {
  const res = await fetch(imageUrl);

  if (res.status === 200) {
    return res.arrayBuffer();
  } else {
    throw new Error(`Non-200 (${res.status}) response for GET ${imageUrl}.`);
  }
};

const getDetectParams = (imageData) => ({
  Image: { Bytes: imageData },
  MaxLabels: 10,
  MinConfidence: 70.0,
});

module.exports = async (path, { fetch, rekog }) => {
  const imageData = await fetchImage(IMAGES_BASE + path, fetch);
  const params = getDetectParams(imageData);
  const tags = await rekog.detectLabels(params).promise();

  return tags.Labels.map((label) => label.Name);
};
