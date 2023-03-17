import {
  Project,
  ProjectReduced,
  WistiaError,
  WistiaVideo,
  WistiaProject,
} from '../components/helpers/types';

const VIDEOS_PER_PAGE = 100;

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
      let videos: WistiaVideo[] = project.medias;

      if (project.mediaCount > VIDEOS_PER_PAGE) {
        // create additional array so we can use promise.all and pattern match with above
        const additionalProjectMedias: WistiaVideo[] = await Promise.all(
          Object.keys(new Array(getTotalPages(project.mediaCount)).fill(0)).map(
            async (page: string) => {
              const response: Response =
                await // start at 2nd page since 1st page is already gotten before this
                await fetch(`https://api.wistia.com/v1/projects/${id}.json?page=${+page + 2}`, {
                  headers: {
                    Authorization: `Bearer ${bearerToken}`,
                  },
                });
              const responseJson = await response.json();
              return responseJson.medias;
            }
          )
        );
        videos = [...videos, ...additionalProjectMedias.flat(1)];
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
