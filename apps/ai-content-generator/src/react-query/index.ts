import { QueryClient } from 'react-query';

const queryClient = new QueryClient();

queryClient.setDefaultOptions({
  queries: {
    retry: true,
    retryDelay: 1000,
    retryOnMount: true,
  },

  mutations: {
    retry: false,
  },
});

export default queryClient;
