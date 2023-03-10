import {
  Project,
  ProjectReduced,
  WistiaError,
  WistiaVideo,
  WistiaProject,
} from '../components/helpers/types';

export const fetchProjects = async (bearerToken: string): Promise<WistiaProject[]> => {
  const projects = await (
    await fetch(`https://api.wistia.com/v1/projects.json`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    })
  ).json();
  if (projects.error) {
    throw new WistiaError({ message: projects.error, code: projects.code });
  } else {
    const reducedProjects = projects.map(({ id, hashedId, name }: ProjectReduced) => {
      return { id, hashedId, name };
    });

    return reducedProjects;
  }
};

export const fetchVideos = async (
  projectIds: string[],
  bearerToken: string,
  page?: number
): Promise<WistiaVideo[]> => {
  const mappedProjects = await Promise.all(
    projectIds.map(async (id: string) => {
      const project = await (
        await fetch(`https://api.wistia.com/v1/projects/${id}.json${page ? '?page=' + page : ''}`, {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        })
      ).json();
      const mappedVideos = project.medias.map((video: WistiaVideo) => ({
        ...video,
        project: {
          id,
        },
      }));
      return mappedVideos;
    })
  );
  // Flatten array of arrays
  const videos = mappedProjects.flat(1);
  return videos;
};
