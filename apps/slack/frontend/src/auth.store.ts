import create from 'zustand';

export interface AuthStore {
  setTemporaryRefreshToken: (temporaryRefreshToken: string) => void;
  temporaryRefreshToken?: string;
  setInstallationUuid: (installationUuid: string) => void;
  installationUuid: string;
}

export const useAuthStore = create<AuthStore>((set) => ({
  temporaryRefreshToken: undefined,
  installationUuid: '',
  setTemporaryRefreshToken: (temporaryRefreshToken: string) =>
    set(() => ({ temporaryRefreshToken })),
  setInstallationUuid: (installationUuid: string) => set(() => ({ installationUuid })),
}));

// Exported without the use* prefix, to not have jest complaining
export const authStore = useAuthStore;
