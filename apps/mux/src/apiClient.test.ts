import ApiClient from './apiClient';

window.fetch = jest.fn();

beforeEach(() => {
  (window.fetch as jest.Mock).mockClear();
});

test('GET request', async () => {
  const resp = 200;
  (window.fetch as jest.Mock).mockResolvedValue(resp);

  const assetId = 'asset-id-1';
  const apiClient = new ApiClient('api-key-id', 'api-key-secret');
  const result = await apiClient.get(`/video/v1/assets/${assetId}`);
  expect(result).toEqual(resp);
  expect(window.fetch).toHaveBeenCalledWith(
    `https://api.mux.com/video/v1/assets/${assetId}`,
    expect.objectContaining({
      method: 'GET',
    })
  );
});

test('POST request', async () => {
  const resp = 200;
  (window.fetch as jest.Mock).mockResolvedValue(resp);

  const apiClient = new ApiClient('api-key-id', 'api-key-secret')
  const result = await apiClient.post('/video/v1/assets')

  expect(result).toEqual(resp);
  expect(window.fetch).toHaveBeenCalledWith(
    'https://api.mux.com/video/v1/assets',
    expect.objectContaining({
      method: 'POST',
    })
  );
});

test('PUT request', async () => {
  const resp = 200;
  (window.fetch as jest.Mock).mockResolvedValue(resp);

  const assetId = 'asset-id-1'
  const apiClient = new ApiClient('api-key-id', 'api-key-secret')
  const result = await apiClient.put(`/video/v1/assets/${assetId}`)

  expect(result).toEqual(resp);
  expect(window.fetch).toHaveBeenCalledWith(
    `https://api.mux.com/video/v1/assets/${assetId}`,
    expect.objectContaining({
      method: 'PUT',
    })
  );
});

test('DELETE request', async () => {
  const resp = 200;
  (window.fetch as jest.Mock).mockResolvedValue(resp);

  const assetId = 'asset-id-1'
  const apiClient = new ApiClient('api-key-id', 'api-key-secret')
  const result = await apiClient.del(`/video/v1/assets/${assetId}`)

  expect(result).toEqual(resp);
  expect(window.fetch).toHaveBeenCalledWith(
    `https://api.mux.com/video/v1/assets/${assetId}`,
    expect.objectContaining({
      method: 'DELETE',
    })
  );
});
