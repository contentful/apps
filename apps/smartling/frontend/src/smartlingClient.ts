export default {
  async getLinkedJobs(
    token: string,
    spaceId: string,
    projectId: string,
    entryId: string
  ): Promise<SmartlingJobsResponse> {
    const res = await fetch(`/entry?spaceId=${spaceId}&projectId=${projectId}&entryId=${entryId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      }
    });

    return (await res.json()) as SmartlingJobsResponse;
  },

  async refresh(refresh_token: string) {
    if (!refresh_token) {
      return {
        failed: true,
        token: ''
      };
    }

    const res = await fetch(`/refresh?refresh_token=${refresh_token}`);

    if (res.status === 200) {
      const { access_token } = await res.json();

      return {
        failed: false,
        token: access_token
      };
    }

    return {
      failed: true,
      token: ''
    };
  }
};
