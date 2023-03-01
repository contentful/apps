import { allowCorsOptionsRequests } from './allowCorsOptionsRequests';
import { apiErrorHandler, apiErrorMapper } from './apiErrorHandler';
import { serviceAccountKeyProvider } from './serviceAccountKeyProvider';
import { verifySignedRequestMiddleware } from './verifySignedRequests';

const Middleware = {
  allowCorsOptionsRequests: allowCorsOptionsRequests,
  verifiySignedRequests: verifySignedRequestMiddleware,
  serviceAccountKeyProvider: serviceAccountKeyProvider,
  apiErrorMapper: apiErrorMapper,
  apiErrorHandler: apiErrorHandler,
};

export default Middleware;
