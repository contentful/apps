import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';
import { ImageEditResult } from './aiig-select-fill';

interface AppActionCallParameters {
  prompt: string;
}

export const handler = async (
  _payload: AppActionCallParameters,
  _context: AppActionCallContext
): Promise<AppActionCallResponse<ImageEditResult>> => {
  const images = [
    {
      url: 'https://www.americanhumane.org/app/uploads/2021/12/Cat-8-1024x1024.png',
      imageType: 'png',
    },
    {
      url: 'https://4kwallpapers.com/images/wallpapers/cat-kitten-pet-domestic-animals-cute-cat-portrait-fur-baby-1024x1024-3528.jpg',
      imageType: 'png',
    },
    {
      url: 'https://wallpaperaccess.com/full/2448381.jpg',
      imageType: 'png',
    },
    {
      url: 'https://images.infoseemedia.com/wp-content/uploads/2022/02/Black-White-Cat-Image-1024x1024.jpg',
      imageType: 'png',
    },
  ];
  return {
    ok: true,
    data: {
      type: 'ImageEditResult',
      images,
    },
  };
};
