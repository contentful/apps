import AppInstallationParameters from '@components/config/appInstallationParameters';

const generateRandomParameters = (): AppInstallationParameters => {
  const randomProfile = Math.random().toString(36).substring(7);

  return {
    model: 'meta.llama2-70b-v1',
    profile: randomProfile,
    accessKeyId: 'AKIAAAAAAAAAAAAAAAAA',
    secretAccessKey: '1234',
    region: 'us-east-1',
    brandProfile: {},
  };
};

export { generateRandomParameters };
