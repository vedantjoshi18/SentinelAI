import React, { createContext, useContext, useState } from 'react';

const WorkspaceContext = createContext(null);

const DEFAULT_WORKSPACES = [
  {
    id: 'ws-atelier',
    name: 'Atelier Studios',
    plan: 'Enterprise',
    slug: 'atelier-studios',
    membersCount: 14,
    avatar: 'A',
  },
  {
    id: 'ws-vogue',
    name: 'Vogue Digital',
    plan: 'Pro Studio',
    slug: 'vogue-digital',
    membersCount: 8,
    avatar: 'V',
  },
  {
    id: 'ws-meridian',
    name: 'Meridian Labs',
    plan: 'Scale',
    slug: 'meridian-labs',
    membersCount: 22,
    avatar: 'M',
  },
];

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState(DEFAULT_WORKSPACES);
  const [activeWorkspace, setActiveWorkspace] = useState(DEFAULT_WORKSPACES[0]);

  const switchWorkspace = (id) => {
    const ws = workspaces.find((w) => w.id === id);
    if (ws) {
      setActiveWorkspace(ws);
    }
  };

  const addWorkspace = ({ name, plan = 'Pro Studio' }) => {
    const newWs = {
      id: 'ws-' + Math.random().toString(36).substring(2, 7),
      name,
      plan,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      membersCount: 1,
      avatar: name.charAt(0).toUpperCase(),
    };
    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspace(newWs);
    return newWs;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        switchWorkspace,
        addWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
