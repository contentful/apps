import React, { createContext, useContext, useState, ReactNode } from 'react';

interface KlaviyoAppContextType {
  isAuthorized: boolean;
  setIsAuthorized: React.Dispatch<React.SetStateAction<boolean>>;
}

const KlaviyoAppContext = createContext<KlaviyoAppContextType | undefined>(undefined);

export const KlaviyoAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  return (
    <KlaviyoAppContext.Provider
      value={{
        isAuthorized,
        setIsAuthorized,
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
