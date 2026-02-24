export type AppInstallationParameters = {
  clientId: string;
  clientSecret: string;
  munchkinId: string;
};

export type FormObject = {
  id: string;
  url: string;
  name: string;
};

export type MarketoFormsResponse = {
  forms?: FormObject[];
};
