import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';
import { EntryProps } from 'contentful-management/types';

interface AppActionCallParameters {
  payload: EntryProps;
  topic: string;
  eventDatetime: string;
}

export const handler = async (
  parameters: AppActionCallParameters,
  context: AppActionCallContext
): Promise<AppActionCallResponse<boolean>> => {
  console.log(parameters, context);

  return {
    ok: true,
    data: true,
  };
};
