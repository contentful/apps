import VercelClient from '@clients/Vercel';
import { ErrorAction } from '@reducers/errorsReducer';
import { Dispatch } from 'react';
import { errorTypes, errorsActions, parametersActions } from '@constants/enums';
import { ApiPath, Errors, Project } from '@customTypes/configPage';
import { validateApiPathData } from '@utils/validateApiPathData/validateApiPathData';
import { ParameterAction } from '@reducers/parameterReducer';

interface FetchAndValidateData {
  dispatchParameters: Dispatch<ParameterAction>;
  dispatchErrors: Dispatch<ErrorAction>;
  vercelClient: VercelClient | null;
  teamId: string | undefined;
}

export const useFetchAndValidateData = ({
  dispatchErrors,
  dispatchParameters,
  vercelClient,
  teamId,
}: FetchAndValidateData) => {
  const validateToken = async (onComplete: () => void, newVercelClient?: VercelClient) => {
    if (vercelClient) {
      try {
        const client = newVercelClient || vercelClient;
        const response = await client.checkToken();

        if (response) {
          if (response.data?.teamId) {
            dispatchParameters({
              type: parametersActions.APPLY_TEAM_ID,
              payload: response.data?.teamId,
            });
          }

          dispatchErrors({
            type: errorsActions.RESET_AUTHENTICATION_ERRORS,
          });
        }
      } catch (e) {
        const err = e as Error;
        dispatchErrors({
          type: errorsActions.UPDATE_AUTHENTICATION_ERRORS,
          payload: (err.message as keyof Errors['authentication']) || 'invalidToken',
        });
      }
      onComplete();
    }
  };

  const fetchProjects = async (setProjects: (projects: Project[]) => void) => {
    if (vercelClient && teamId) {
      try {
        const data = await vercelClient.listProjects(teamId);
        setProjects(data.projects || []);
        dispatchErrors({
          type: errorsActions.RESET_PROJECT_SELECTION_ERRORS,
        });
      } catch (e) {
        console.error(e);
        dispatchErrors({
          type: errorsActions.UPDATE_PROJECT_SELECTION_ERRORS,
          payload: errorTypes.CANNOT_FETCH_PROJECTS,
        });
      }
    }
  };

  const fetchApiPaths = async (
    setApiPaths: (paths: ApiPath[]) => void,
    selectedProject: string
  ) => {
    if (vercelClient && teamId) {
      try {
        const data = await vercelClient.listApiPaths(selectedProject, teamId);
        setApiPaths(validateApiPathData(data) ? data : []);
        dispatchErrors({
          type: errorsActions.RESET_API_PATH_SELECTION_ERRORS,
        });
      } catch (e) {
        const err = e as Error;
        console.error(e);
        const errorAction = errorsActions.UPDATE_API_PATH_SELECTION_ERRORS;

        if (err.message === errorTypes.API_PATHS_EMPTY) {
          dispatchErrors({
            type: errorAction,
            payload: errorTypes.API_PATHS_EMPTY,
          });
        } else {
          dispatchErrors({
            type: errorAction,
            payload: errorTypes.CANNOT_FETCH_API_PATHS,
          });
        }
        setApiPaths([]);
      }
    }
  };

  return { validateToken, fetchProjects, fetchApiPaths };
};
