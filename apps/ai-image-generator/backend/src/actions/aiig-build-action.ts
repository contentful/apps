import { AppActionCallContext } from '@contentful/node-apps-toolkit';

interface AppActionCallParameters {
  prompt: string;
}

interface AppActionResponse {
  status: number;
  prompt: string;
  images: string[];
}

export const handler = async (
  payload: AppActionCallParameters,
  _context: AppActionCallContext
): Promise<AppActionResponse> => {
  const { prompt } = payload;
  return {
    status: 201,
    prompt,
    images: [
      `https://www.americanhumane.org/app/uploads/2021/12/Cat-8-1024x1024.png`,
      `https://4kwallpapers.com/images/wallpapers/cat-kitten-pet-domestic-animals-cute-cat-portrait-fur-baby-1024x1024-3528.jpg`,
      `https://wallpaperaccess.com/full/2448381.jpg`,
      `https://images.infoseemedia.com/wp-content/uploads/2022/02/Black-White-Cat-Image-1024x1024.jpg`,
    ],
  };
};
