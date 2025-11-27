import { createContext, useContext, useState, ReactNode } from "react";

interface WorkspaceContextType {
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
}

// Default to your demo ID for development, but this will be dynamic
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // In a real app, this initial state comes from your User/Auth database object
  const [workspaceId, setWorkspaceId] = useState("demo-workspace-1");

  return (
    <WorkspaceContext.Provider value={{ workspaceId, setWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}