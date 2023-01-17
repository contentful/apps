type Callback = () => void;

const noop = () => {
  // noop
};

const makeMockSdk = () => {
  const onConfigureCache: Callback[] = [];
  const onConfigurationCompletedCache: Callback[] = [];

  return {
    sdk: {
      app: {
        onConfigure: (cb: Callback) => onConfigureCache.push(cb),
        onConfigurationCompleted: (cb: Callback) => onConfigurationCompletedCache.push(cb),
        getParameters: () => ({}),
        setReady: noop,
        getCurrentState: noop,
        isInstalled: () => Promise.resolve(false),
      },
      ids: {
        space: 'space-id',
        environment: 'env-id',
      },
      notifier: {
        error: noop,
        success: noop,
      },
    } as any,
    callbacks: {
      onConfigure: async () => onConfigureCache.pop()?.(),
      onConfigurationCompleted: async () => onConfigurationCompletedCache.pop()?.(),
    },
  };
};

export { makeMockSdk };
