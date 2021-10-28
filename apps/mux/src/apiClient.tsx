class ApiClient {
  tokenId: string;
  tokenSecret: string;
  baseOptions?: {
    mode: 'cors';
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers: Headers;
  };

  constructor(tokenId: string, tokenSecret: string) {
    this.tokenId = tokenId;
    this.tokenSecret = tokenSecret;
  }

  requestHeaders = () => {
    let headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(`${this.tokenId}:${this.tokenSecret}`));
    headers.set('Content-Type', 'application/json');

    return headers;
  };

  createSigningKey() {
    return this.request('POST', '/video/v1/signing-keys');
  }

  get = async (path: string) => {
    return this.request('GET', path);
  };

  post = async (path: string, body?: string) => {
    return this.request('POST', path, body);
  };

  put = async (path: string, body?: string) => {
    return this.request('PUT', path, body);
  };

  del = async (path: string) => {
    return this.request('DELETE', path);
  };

  request = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: string) => {
    return fetch(`https://api.mux.com${path}`, {
      ...this.baseOptions,
      method,
      headers: this.requestHeaders(),
      body,
    });
  };
}

export default ApiClient;
