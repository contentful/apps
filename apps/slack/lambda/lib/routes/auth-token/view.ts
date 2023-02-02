import { URL } from 'url';

export const template = (
  frontendUrl: string,
  params: {
    accessToken?: string;
    refreshToken?: string;
    state?: string;
    result: string;
    errorMessage?: string;
  }
) => {
  const redirectUrl = new URL(frontendUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      redirectUrl.searchParams.append(key, value);
    }
  });

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>Loading...</title>
  </head>
  <body>
  Loading...
  <script>
    window.location.href = '${redirectUrl.toString()}'
  </script>
  </body>
  </html>
  `;
};
