import { AppInstallationParameters } from '../types';

export const initialParameters: AppInstallationParameters = {
  vercelAccessToken: '',
  vercelAccessTokenStatus: null,
  projects: [],
  contentTypes: [],
  selectedProject: '',
  selectedContentType: '',
};

export const baseEndpoint = 'https://api.vercel.com';
