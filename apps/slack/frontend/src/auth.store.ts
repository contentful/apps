import create from 'zustand';

export interface AuthStore {
  setTemporaryRefreshToken: (temporaryRefreshToken: string) => void;
  temporaryRefreshToken?: string;
}

export const useAuthStore = create<AuthStore>((set) => ({
  temporaryRefreshToken: undefined,
  setTemporaryRefreshToken: (temporaryRefreshToken: string) =>
    set(() => ({ temporaryRefreshToken })),
}));

// Exported without the use* prefix, to not have jest complaining
export const authStore = useAuthStore;
