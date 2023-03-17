export interface ProjectReduced {
  id: string;
  hashedId: string;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  medias: WistiaVideo[];
  mediaCount: number;
  created: string;
  updated: string;
  hashedId: string;
  anonymousCanUpload: boolean;
  anonymousCanDownload: boolean;
  public: boolean;
  publicId: string;
  description: string;
}

export interface WistiaVideo {
  id: number;
  name: string;
  type: string;
  created: string;
  updated: string;
  duration: number;
  hashed_id: string;
  description: string;
  progress: number;
  status: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
}

export interface WistiaProject {
  id: number;
  name: string;
  hashedId: string;
  duration?: string;
  medias: WistiaVideo[];
  mediaCount: number;
  thumbnail: {
    url: string;
  };
}

interface WistiaResponse {
  message: string;
  code?: string;
}

export class WistiaError implements WistiaResponse {
  message: string;
  code?: string;

  constructor(options: WistiaResponse) {
    this.message = options.message;
    this.code = options.code;
  }
}
