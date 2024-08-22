const mockCma: any = {
  appSignedRequest: {
    create: () => ({}),
  },
  getSpace: () => ({
    getEnvironment: () => ({
      getEditorInterfaces: () => ({
        items: [],
      }),
      getContentTypes: () => ({
        items: [],
      }),
    }),
  }),
};

export { mockCma };
