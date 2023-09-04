import { Request } from 'express';

export function getHost(req: Request): string {
  try {
    const crn = req.header('x-contentful-crn');
    const partition = crn?.split(':')[1];

    switch (partition) {
      case 'contentful':
        return 'api.contentful.com';
      case 'contentful-eu':
        return 'api.eu.contentful.com';
      default:
        return 'api.contentful.com';
    }
  } catch (error) {
    console.error(error);
    return 'api.contentful.com';
  }
}
