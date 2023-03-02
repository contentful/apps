export interface ProjectReduced {
  id: string;
  hashedId: string;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  medias?: [];
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

export interface ProjectVideo {
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
