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

const getTotalPages = (count: number) => {
  return Math.ceil(count / 100);
};

export const fetchVideos = async (
  projectIds: string[],
  bearerToken: string
): Promise<WistiaVideo[]> => {
  const mappedProjects = await Promise.all(
    projectIds.map(async (id: string) => {
      const project = await (
        await fetch(`https://api.wistia.com/v1/projects/${id}.json`, {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        })
      ).json();
      let videos = project.medias;
      if (project.mediaCount > 100) {
        // start at 2 since the first page is already gotten
        for (let i = 2; i <= getTotalPages(project.mediaCount); i++) {
          const additionalProject = await (
            await fetch(`https://api.wistia.com/v1/projects/${id}.json?page=${i}`, {
              headers: {
                Authorization: `Bearer ${bearerToken}`,
              },
            })
          ).json();
          videos = [...videos, ...additionalProject.medias];
        }
      }
      const mappedVideos = videos.map((video: WistiaVideo) => ({
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
