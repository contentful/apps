import create from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export enum SlackAppEventKey {
  PUBLISH = 'publish',
  UNPUBLISHED = 'unpublish',
  CREATED = 'create',
  DELETED = 'delete',
}

export interface SlackNotification {
  id: string;
  selectedChannel: string | null;
  selectedContentType: string | null;
  selectedEvent: Record<SlackAppEventKey, boolean>;
}

interface NotificationStore {
  active: boolean;
  notifications: SlackNotification[];
  getNotificationByIndex: (index: number) => SlackNotification;
  setSelectedChannel: (channelId: string, index: number) => void;
  setSelectedContentType: (contentTypeId: string, index: number) => void;
  toggleEvent: (event: SlackAppEventKey, index: number) => void;
  createNotification: (notification?: Omit<SlackNotification, 'id'>) => void;
  setNotifications: (notifications: SlackNotification[]) => void;
  removeNotificationAtIndex: (index: number) => void;
  setActive: (active: boolean) => void;
}

const NOTIFICATION_TEMPLATE: Omit<SlackNotification, 'id'> = {
  selectedChannel: null,
  selectedContentType: null,
  selectedEvent: {
    [SlackAppEventKey.PUBLISH]: false,
    [SlackAppEventKey.UNPUBLISHED]: false,
    [SlackAppEventKey.CREATED]: false,
    [SlackAppEventKey.DELETED]: false,
  },
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  active: true,
  notifications: [],
  getNotificationByIndex: (index: number) => get().notifications[index],
  removeNotificationAtIndex: (index: number) =>
    set((state) => {
      const notificationCopy = [...state.notifications];
      notificationCopy.splice(index, 1);
      return { notifications: notificationCopy };
    }),
  setSelectedChannel: (channelId: string, index: number) =>
    set((state) => {
      const notificationCopy = [...state.notifications];
      notificationCopy[index] = { ...notificationCopy[index], selectedChannel: channelId };
      return { notifications: notificationCopy };
    }),
  setSelectedContentType: (contentTypeId: string, index: number) =>
    set((state) => {
      const notificationCopy = [...state.notifications];
      notificationCopy[index] = { ...notificationCopy[index], selectedContentType: contentTypeId };
      return { notifications: notificationCopy };
    }),
  toggleEvent: (event: SlackAppEventKey, index: number) =>
    set((state) => {
      const notificationCopy = [...state.notifications];
      notificationCopy[index] = {
        ...notificationCopy[index],
        selectedEvent: {
          ...notificationCopy[index].selectedEvent,
          [event]: !notificationCopy[index].selectedEvent[event],
        },
      };
      return { notifications: notificationCopy };
    }),
  createNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...(notification || NOTIFICATION_TEMPLATE), id: uuidv4() },
      ],
    })),
  setNotifications: (notifications: SlackNotification[]) =>
    set({
      // backfill ids for notifications persisted before ids were introduced
      notifications: notifications.map((notification) => ({
        ...notification,
        id: notification.id || uuidv4(),
      })),
    }),
  setActive: (active: boolean) => set({ active }),
}));
