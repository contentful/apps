export const getAsset = (assetId: string) => {
}

export const createSigningToken = () => {
}

class ApiClient {
  tokenId: string;
  tokenSecret: string;
  baseOptions?: {
    mode: 'cors',
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers: Headers
  };

  constructor (tokenId: string, tokenSecret: string) {
    this.tokenId = tokenId;
    this.tokenSecret = tokenSecret;
  }

  requestHeaders = () => {
    let headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(`${this.tokenId}:${this.tokenSecret}`));
    headers.set('Content-Type', 'application/json');

    return headers;
  };

  createSigningKey () {
    return this.request('POST', '/video/v1/signing-keys')
  }

  get = async (path: string) => {
    return this.request('GET', path);
  }

  post = async (path: string) => {
    return this.request('POST', path);
  }

  put = async (path: string) => {
    return this.request('PUT', path);
  }

  del = async (path: string) => {
    return this.request('DELETE', path);
  }

  request = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string) => {
    const resp = await fetch(
      `https://api.mux.com${path}`,
      {
        ...this.baseOptions,
        method,
        headers: this.requestHeaders()
      }
    )
    if (resp.ok) {
      return resp.json()
    } else {
      try {
        return resp.json()
      } catch (e) {
        return { error: 'Request error', messages: ['Error with fetch request'] }
      }
    }
  }
}

export default ApiClient;
