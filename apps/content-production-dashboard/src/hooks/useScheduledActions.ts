import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { useQuery } from "@tanstack/react-query";
import { ScheduledActionProps } from "contentful-management";
import { fetchScheduledActions, FetchScheduledActionsResult } from "../utils/fetchScheduledActions";

export interface UseScheduledActionsResult {
    scheduledActions: ScheduledActionProps[];
    total: number;
    isFetching: boolean;
    error: Error | null;
    refetch: () => void;
    fetchedAt: Date | undefined;
  }
  
  export function useScheduledActions(): UseScheduledActionsResult {
    const sdk = useSDK<PageAppSDK>();
  
    const { data, isFetching, error, refetch } = useQuery<FetchScheduledActionsResult, Error>({
      queryKey: ['scheduledActions', sdk.ids.space, sdk.ids.environment],
      queryFn: () => fetchScheduledActions(sdk),
    });
  
    return {
      scheduledActions: data?.scheduledActions || [],
      total: data?.total || 0,
      isFetching,
      error,
      refetch,
      fetchedAt: data?.fetchedAt,
    };
  }