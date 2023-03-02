import { Project, ProjectReduced, ProjectVideo } from '../components/helpers/types';

export const fetchProjects = async (bearerToken: string) => {
  const projects = await (
    await fetch(`https://api.wistia.com/v1/projects.json`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    })
  ).json();
  if (projects.error) {
    return {
      success: false,
      error: projects.error,
      code: projects.code,
    };
  }

  const reducedProject = projects.map(({ id, hashedId, name }: ProjectReduced) => {
    return { id, hashedId, name };
  });

  return {
    success: true,
    projects: reducedProject,
  };
};

export const fetchVideos = async (
  excludedProjects: Project[],
  bearerToken: string,
  page?: number
) => {
  const projectsResponse = await fetchProjects(bearerToken);
  if (projectsResponse.success) {
    console.info('Succesfully fetched the Wistia projects.');
    const { projects } = projectsResponse;
    // Map through projects and return ids to retrieve all the videos from each project. Filter out the projects selected to be excluded
    const projectIds = projects
      .map((item: Project) => item.hashedId)
      .filter((id: string) => {
        const include =
          excludedProjects.findIndex((project: Project) => project.hashedId === id) === -1;
        return include;
      });
    const mappedProjects = await Promise.all(
      projectIds.map(async (id: string) => {
        const project = await (
          await fetch(`https://api.wistia.com/v1/projects/${id}.json`, {
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
    return {
      response: projectsResponse,
      videos,
    };
  } else {
    console.info(`Impossible to fetch the projects: ${projectsResponse.error}`);
    return {
      response: projectsResponse,
      videos: [],
    };
  }
};
