const mockCma: any = {
  appSignedRequest: {
    create: () => Promise.resolve({ additionalHeaders: 'lol' }),
  },
  contentType: {
    getMany: () => Promise.resolve({ sys: { id: 'content type' } }),
  },
};
export { mockCma };
