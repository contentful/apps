import AppInstallationParameters from '@components/config/appInstallationParameters';

const generateRandomParameters = (): AppInstallationParameters => {
  const randomApiKey = window.btoa(Math.random().toString() + Math.random().toString).slice(0, 48);
  const randomProfile = Math.random().toString(36).substring(7);

  return {
    model: 'gpt-4',
    key: 'sk-' + randomApiKey,
    profile: randomProfile,
    brandProfile: {},
  };
};

export { generateRandomParameters };
