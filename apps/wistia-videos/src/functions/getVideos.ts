import { Project, ProjectReduced, ProjectVideo, WistiaError } from '../components/helpers/types';

export const fetchProjects = async (bearerToken: string) => {
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
    const reducedProject = projects.map(({ id, hashedId, name }: ProjectReduced) => {
      return { id, hashedId, name };
    });

    return {
      projects: reducedProject,
    };
  }
};

export const fetchVideos = async (projectIds: string[], bearerToken: string, page?: number) => {
  const mappedProjects = await Promise.all(
    projectIds.map(async (id: string) => {
      const project = await (
        await fetch(`https://api.wistia.com/v1/projects/${id}.json${page ? 'page=' + page : ''}`, {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        })
      ).json();
      const mappedVideos = project.medias.map((video: ProjectVideo) => ({
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
