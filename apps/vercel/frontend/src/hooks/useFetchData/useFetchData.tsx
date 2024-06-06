import VercelClient from '@clients/Vercel';
import { ErrorAction } from '@reducers/errorsReducer';
import { Dispatch } from 'react';
import { errorTypes, errorsActions, parametersActions } from '@constants/enums';
import { ApiPath, Errors, Project } from '@customTypes/configPage';
import { ParameterAction } from '@reducers/parameterReducer';

interface FetchData {
  dispatchParameters: Dispatch<ParameterAction>;
  dispatchErrors: Dispatch<ErrorAction>;
  vercelClient: VercelClient | null;
  teamId: string | undefined;
}

export const useFetchData = ({
  dispatchErrors,
  dispatchParameters,
  vercelClient,
  teamId,
}: FetchData) => {
  const validateToken = async (onComplete: () => void, newVercelClient?: VercelClient) => {
    if (vercelClient) {
      // reset all authentication errors before validating again
      dispatchErrors({
        type: errorsActions.RESET_AUTHENTICATION_ERRORS,
      });

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
        setApiPaths(data);
        dispatchErrors({
          type: errorsActions.RESET_API_PATH_SELECTION_ERRORS,
        });
      } catch (e) {
        const err = e as Error;
        const errorAction = errorsActions.UPDATE_API_PATH_SELECTION_ERRORS;

        if (err.message === errorTypes.API_PATHS_EMPTY) {
          dispatchErrors({
            type: errorAction,
            payload: errorTypes.API_PATHS_EMPTY,
          });
        } else if (err.message === errorTypes.INVALID_DEPLOYMENT_DATA) {
          dispatchErrors({
            type: errorAction,
            payload: errorTypes.INVALID_DEPLOYMENT_DATA,
          });
        } else {
          console.error(e);
          dispatchErrors({
            type: errorAction,
            payload: errorTypes.CANNOT_FETCH_API_PATHS,
          });
        }
        setApiPaths([]);
      }
    }
  };

  const validateProjectEnv = async (
    currentSpaceId: string,
    projectId: string,
    selectedProject?: Project
  ) => {
    if (vercelClient && teamId) {
      try {
        const isProjectSelectionValid = await vercelClient.validateProjectContentfulSpaceId(
          currentSpaceId,
          projectId,
          teamId
        );
        if (!isProjectSelectionValid) {
          throw new Error(errorTypes.INVALID_SPACE_ID);
        }

        const protectionBypassIsDisabled = selectedProject && !selectedProject.protectionBypass;
        if (protectionBypassIsDisabled) {
          throw new Error(errorTypes.PROTECTION_BYPASS_IS_DISABLED);
        }

        dispatchErrors({
          type: errorsActions.RESET_PROJECT_SELECTION_ERRORS,
        });
      } catch (e) {
        const err = e as Error;
        if (err.message === errorTypes.INVALID_SPACE_ID) {
          dispatchErrors({
            type: errorsActions.UPDATE_PROJECT_SELECTION_ERRORS,
            payload: errorTypes.INVALID_SPACE_ID,
          });
        }

        if (err.message === errorTypes.PROTECTION_BYPASS_IS_DISABLED) {
          dispatchErrors({
            type: errorsActions.UPDATE_PROJECT_SELECTION_ERRORS,
            payload: errorTypes.PROTECTION_BYPASS_IS_DISABLED,
          });
        }
      }
    }
  };

  return { validateToken, fetchProjects, fetchApiPaths, validateProjectEnv };
};
