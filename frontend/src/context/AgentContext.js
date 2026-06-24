import React, { createContext, useContext, useState, useCallback } from 'react';

const AgentContext = createContext({
  selectedAgent: null,
  setSelectedAgent: () => {},
  clearSelectedAgent: () => {},
});

export function AgentProvider({ children }) {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const clearSelectedAgent = useCallback(() => {
    setSelectedAgent(null);
  }, []);

  return (
    <AgentContext.Provider value={{ selectedAgent, setSelectedAgent, clearSelectedAgent }}>
      {children}
    </AgentContext.Provider>
  );
}

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

export default AgentContext;
