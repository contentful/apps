import AppInstallationParameters from '@components/config/appInstallationParameters';

const generateRandomParameters = (): AppInstallationParameters => {
  const randomProfile = Math.random().toString(36).substring(7);

  return {
    model: 'gpt-4',
    profile: randomProfile,
    brandProfile: {},
  };
};

export { generateRandomParameters };
