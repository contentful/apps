const mockCrypto: any = {
  randomUUID: jest.fn().mockReturnValue('mocked-uuid'),
};

export { mockCrypto };
