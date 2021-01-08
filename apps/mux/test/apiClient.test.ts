/* eslint-disable @typescript-eslint/no-explicit-any */
import 'isomorphic-fetch';
import nock from 'nock';
import ApiClient from '../src/apiClient'

test('GET request', async () => {
  const assetId = 'asset-id-1'
  const scope = nock('https://api.mux.com').get(`/video/v1/assets/${assetId}`).reply(200, '{}')
  const apiClient = new ApiClient('api-key-id', 'api-key-secret')
  await apiClient.get(`/video/v1/assets/${assetId}`)
  expect(scope.isDone()).toBe(true)
});

test('POST request', async () => {
  const scope = nock('https://api.mux.com').post('/video/v1/assets').reply(200, '{}')
  const apiClient = new ApiClient('api-key-id', 'api-key-secret')
  await apiClient.post('/video/v1/assets')
  expect(scope.isDone()).toBe(true)
});

test('PUT request', async () => {
  const assetId = 'asset-id-1'
  const scope = nock('https://api.mux.com').put(`/video/v1/assets/${assetId}`).reply(200, '{}')
  const apiClient = new ApiClient('api-key-id', 'api-key-secret')
  await apiClient.put(`/video/v1/assets/${assetId}`)
  expect(scope.isDone()).toBe(true)
});

test('DELETE request', async () => {
  const assetId = 'asset-id-1'
  const scope = nock('https://api.mux.com').delete(`/video/v1/assets/${assetId}`).reply(200, '{}')
  const apiClient = new ApiClient('api-key-id', 'api-key-secret')
  await apiClient.del(`/video/v1/assets/${assetId}`)
  expect(scope.isDone()).toBe(true)
});
