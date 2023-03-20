import {
  Project,
  ProjectReduced,
  WistiaError,
  WistiaVideo,
  WistiaProject,
} from '../components/helpers/types';

const PROJECTS_PER_PAGE = 100;
const VIDEOS_PER_PAGE = 500;

const fetchProjectsJSON = async (
  bearerToken: string,
  page: number,
  accumulated: WistiaProject[]
): Promise<WistiaProject[]> => {
  let projects = await (
    await fetch(`https://api.wistia.com/v1/projects.json${page ? '?page=' + page : ''}`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    })
  ).json();
  accumulated = [...accumulated, ...projects];
  if (projects.error) {
    throw new WistiaError({ message: projects.error, code: projects.code });
  }
  // for the projects response, Wistia doesn't give us a `count` of available projects, so have to brute force it
  else if (projects.length === PROJECTS_PER_PAGE) {
    return fetchProjectsJSON(bearerToken, (page += 1), accumulated);
  } else {
    return accumulated;
  }
};

export const fetchProjects = async (bearerToken: string): Promise<ProjectReduced[]> => {
  let projects = await fetchProjectsJSON(bearerToken, 1, []);
  const reducedProjects = projects.map(({ id, hashedId, name }: WistiaProject) => {
    return { id, hashedId, name };
  });

  return reducedProjects;
};

const getTotalPages = (count: number) => {
  return Math.ceil(count / VIDEOS_PER_PAGE);
};

export const fetchVideos = async (
  projectIds: string[],
  bearerToken: string
): Promise<WistiaVideo[]> => {
  const mappedProjects = await Promise.all(
    projectIds.map(async (id: string) => {
      const project: WistiaProject = await (
        await fetch(`https://api.wistia.com/v1/projects/${id}.json`, {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        })
      ).json();
      if (project.mediaCount > VIDEOS_PER_PAGE) {
        // create additional array so we can use promise.all and pattern match with above
        const pageCount = getTotalPages(project.mediaCount) - 1;

        const pagesToFetch = Array.from({ length: pageCount }, (_, i) => i + 2);

        const additionalProjectMedias: WistiaVideo[] = await Promise.all(
          pagesToFetch.map(async (page) => {
            const response: Response = await fetch(
              `https://api.wistia.com/v1/projects/${id}.json?page=${page}`,
              {
                headers: {
                  Authorization: `Bearer ${bearerToken}`,
                },
              }
            );
            const responseJson = await response.json();
            return responseJson.medias;
          })
        );

        project.medias = [...project.medias, ...additionalProjectMedias.flat(1)];
      }
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
