import http from 'http';
import fs from 'fs';
import path from 'path';

const MOCKS_FOLDER = './test/mocks';

// simple mock server for serving static files from ./test/mocks
export const mocksServer = http.createServer(function (req, res) {
  const parsedUrl = new URL(req.url!, 'http://localhost');
  const pathname = `.${parsedUrl.pathname}`;
  const ext = path.parse(pathname).ext;

  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
  };

  if (!mimeTypes[ext]) {
    res.statusCode = 500;
    res.end(`Unsupported extension: ${ext}.`);
    return;
  }

  const fullPath = path.resolve(process.cwd(), MOCKS_FOLDER, pathname);

  if (fs.existsSync(fullPath)) {
    try {
      const data = fs.readFileSync(fullPath);
      res.setHeader('Content-type', mimeTypes[ext]);
      res.end(data);
    } catch (err) {
      res.statusCode = 500;
      res.end(`Error getting the file: ${err}.`);
    }
  } else {
    res.statusCode = 404;
    res.end(`File ${pathname} not found at '${fullPath}'`);
    return;
  }
});

export const startMocksServer = async (port: number = 8002): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    mocksServer.listen(port, () => {
      resolve(true);
    });
    mocksServer.on('error', (e) => {
      reject(e);
    });
  });
};

export const stopMocksServer = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    mocksServer.close((e) => {
      if (e) {
        reject(e);
      } else {
        resolve(true);
      }
    });
    setImmediate(() => {
      mocksServer.emit('close');
    });
  });
};
