import React, { createContext, useContext, useState, ReactNode } from 'react';
import { KlaviyoOAuthConfig } from '../config/klaviyo';

interface KlaviyoAppContextType {
  isAuthorized: boolean;
  setIsAuthorized: React.Dispatch<React.SetStateAction<boolean>>;
  config: KlaviyoOAuthConfig | null;
  setConfig: React.Dispatch<React.SetStateAction<KlaviyoOAuthConfig | null>>;
}

const KlaviyoAppContext = createContext<KlaviyoAppContextType | undefined>(undefined);

export const KlaviyoAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [config, setConfig] = useState<KlaviyoOAuthConfig | null>(null);

  return (
    <KlaviyoAppContext.Provider
      value={{
        isAuthorized,
        setIsAuthorized,
        config,
        setConfig,
      }}>
      {children}
    </KlaviyoAppContext.Provider>
  );
};

export const useKlaviyoApp = (): KlaviyoAppContextType => {
  const context = useContext(KlaviyoAppContext);
  if (context === undefined) {
    throw new Error('useKlaviyoApp must be used within a KlaviyoAppProvider');
  }
  return context;
};
