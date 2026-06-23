import React, { createContext, useContext } from 'react';

const PortalModeContext = createContext({
  portalMode: 'Enterprise',
  setPortalMode: () => {},
});

export const PortalModeProvider = ({ value, children }) => (
  <PortalModeContext.Provider value={value}>{children}</PortalModeContext.Provider>
);

export const usePortalMode = () => {
  const context = useContext(PortalModeContext);
  if (!context) {
    throw new Error('usePortalMode must be used within a PortalModeProvider');
  }
  return context;
};

export default PortalModeContext;

