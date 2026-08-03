import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';

const generateRandomParameters = (): PersistedInstallationParameters => {
  const randomProfile = Math.random().toString(36).substring(7);

  return {
    model: 'gpt-4',
    profile: randomProfile,
  };
};

export { generateRandomParameters };
