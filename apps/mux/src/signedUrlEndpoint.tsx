import jwt from 'jsonwebtoken';

const validateSignatures = (
  token: string,
  expectedAud: string,
  expectedSub: string
) => {
  // we are not *verifying* signatures here -- that can only be done on a server
  // all we want to do is decode and make sure the 'aud', 'sub' and timestamp values
  // are what we expect
  const decoded = jwt.decode(token);
  if (decoded.aud !== expectedAud) {
    throw new Error(
      `Expected token to have aud param ${expectedAud} but had ${decoded.aud}`
    );
  }
  if (decoded.sub !== expectedSub) {
    throw new Error(`Token signature playbackIDs do not match`);
  }
  if (!decoded.exp) {
    throw new Error(`Expected token to have an exp param but it does not`);
  }
  if (decoded.exp < new Date().valueOf() / 1000) {
    throw new Error(
      `Token has an expiration time but that time is in the past, please set a longer timeframe on the signature`
    );
  }
};

export const fetchTokens = async (playbackId: string, endpoint: string) => {
  const url = new URL(endpoint);
  url.searchParams.set('playbackId', playbackId);
  const urlStringWithoutAuth = `${url.origin}${url.pathname}${url.search}`;
  const headers = {};
  if (url.username || url.password) {
    const basicAuth = btoa(`${url.username}:${url.password}`);
    headers['Authorization'] = `Basic ${basicAuth}`;
  }
  const resp = await fetch(urlStringWithoutAuth, { method: 'GET', headers });
  if (resp.ok) {
    let json;
    try {
      json = await resp.json();
    } catch (e) {
      console.error(e);
      throw new Error(`Error with JSON response body`);
    }
    if (!json.playbackToken && !json.thumbnailToken) {
      throw new Error(
        'Response body JSON is missing both playbackToken and thumbnailToken'
      );
    }
    if (!json.playbackToken) {
      throw new Error('Response body JSON is missing playbackToken');
    }
    if (!json.thumbnailToken) {
      throw new Error('Response body JSON is missing thumbnailToken');
    }
    validateSignatures(json.playbackToken, 'v', playbackId);
    validateSignatures(json.thumbnailToken, 't', playbackId);
    return json;
  } else {
    console.error(resp);
    throw new Error(
      `Expected a 200 response, got ${resp.status} ${resp.statusText}`
    );
  }
};
