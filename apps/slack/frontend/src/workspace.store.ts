import create from 'zustand';
import { byChannelName } from './utils';

export interface SlackChannel {
  creator: string;
  id: string;
  is_archived: boolean;
  is_channel: boolean;
  is_ext_shared: boolean;
  is_general: boolean;
  is_group: boolean;
  is_im: boolean;
  is_member: boolean;
  is_mpim: boolean;
  is_org_shared: boolean;
  is_pending_ext_shared: boolean;
  is_private: boolean;
  is_shared: boolean;
  name: string;
  name_normalized: string;
  num_members: number;
}

export interface SlackChannelSimplified {
  id: string;
  name: string;
}

export interface ConnectedWorkspace {
  id: string;
  name: string;
  icon: Record<string, string>;
}

export enum WorkspaceState {
  IDLE = 'idle',
  SUCCESS = 'success',
  LOADING = 'loading',
  ERROR = 'error',
}

interface WorkspaceStore {
  workspaceState: WorkspaceState;
  setWorkspaceState: (newState: WorkspaceState) => void;
  connectedWorkspaces: Record<string, ConnectedWorkspace>;
  channels: SlackChannelSimplified[] | undefined;
  notificationsLoading: boolean;
  setNotificationsLoading: (loadingState: boolean) => void;
  setChannels: (channels: SlackChannelSimplified[]) => void;
  addConnectedWorkspace: (workspace: ConnectedWorkspace) => void;
  removeConnectedWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaceState: WorkspaceState.IDLE,
  setWorkspaceState: (newWorkspaceState) => set({ workspaceState: newWorkspaceState }),
  connectedWorkspaces: {},
  notificationsLoading: false,
  channels: undefined,
  setNotificationsLoading: (loadingState: boolean) => set({ notificationsLoading: loadingState }),
  setChannels: (channels: SlackChannelSimplified[]) =>
    set({ channels: channels.sort(byChannelName) }),
  addConnectedWorkspace: (workspace: ConnectedWorkspace) =>
    set((state) => ({
      connectedWorkspaces: {
        ...state.connectedWorkspaces,
        [workspace.id]: workspace,
      },
    })),
  removeConnectedWorkspace: (id: string) =>
    set((state) => {
      const workspacesCopy = { ...state.connectedWorkspaces };
      delete workspacesCopy[id];
      return {
        connectedWorkspaces: workspacesCopy,
      };
    }),
}));
