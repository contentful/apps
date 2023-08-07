import { AppActionCallContext } from '@contentful/node-apps-toolkit';

interface AppActionCallParameters {
  prompt: string;
}

export const handler = async (payload: AppActionCallParameters, context: AppActionCallContext) => {
  const { prompt } = payload;
  try {
    console.log(prompt);
  } catch (err) {}

  return {
    status: 201,
    prompt,
    image: `https://weu-az-web-ca-cdn.azureedge.net/mediacontainer/medialibraries/mypetdoctor/images/blog-images/grey-kitten.webp?ext=.webp`,
  };
};
