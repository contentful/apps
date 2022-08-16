export const fetchProjects = async (bearerToken) => {
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

  const reducedProject = projects.map(({ id, hashedId, name }) => {
    return { id, hashedId, name };
  });

  return {
    success: true,
    projects: reducedProject,
  };
};

export const fetchVideos = async (excludedProjects, bearerToken) => {
  const projectsResponse = await fetchProjects(bearerToken);
  if (projectsResponse.success) {
    console.info('Succesfully fetched the Wistia projects.');
    const { projects } = projectsResponse;
    // Map through projects and return ids to retrieve all the videos from each project. Filter out the projects selected to be excluded
    const projectIds = projects
      .map((item) => item.hashedId)
      .filter((id) => {
        const include =
          excludedProjects.findIndex((project) => project.hashedId === id) ===
          -1;
        return include;
      });
    const mappedProjects = await Promise.all(
      projectIds.map(async (id) => {
        const project = await (
          await fetch(`https://api.wistia.com/v1/projects/${id}.json`, {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
          })
        ).json();
        const mappedVideos = project.medias.map((video) => ({
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
