import {
  createContext, useContext, useEffect, useState, useCallback,
  useRef, ReactNode,
} from "react";
import { API_BASE_URL } from "../../config";

// Normalise provider IDs — IntegrationsPage uses "clearbit_p" for the
// prospecting variant; everywhere else it's just "clearbit".
const normalise = (id: string) => (id === "clearbit_p" ? "clearbit" : id);

const STORAGE_KEY = "iqpipe_connected_tools";

type Ctx = {
  connectedTools: Set<string>;
  isLoading: boolean;
  refresh: () => Promise<void>;
  markConnected: (id: string) => void;
  markDisconnected: (id: string) => void;
};

const IntegrationsContext = createContext<Ctx>({
  connectedTools: new Set(),
  isLoading: false,
  refresh: async () => {},
  markConnected: () => {},
  markDisconnected: () => {},
});

export function useIntegrations() {
  return useContext(IntegrationsContext);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveToStorage(tools: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...tools]));
  } catch {}
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function IntegrationsProvider({ children }: { children: ReactNode }) {
  // Initialise synchronously from localStorage so the first render is accurate.
  const [connectedTools, setConnectedTools] = useState<Set<string>>(loadFromStorage);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("iqpipe_token")}`,
  });

  /** Re-fetch connected integrations from the API and persist to localStorage. */
  const refresh = useCallback(async () => {
    const token = localStorage.getItem("iqpipe_token");
    if (!token) return;
    if (!mountedRef.current) return;
    setIsLoading(true);
    try {
      const wsRes = await fetch(`${API_BASE_URL}/api/workspaces/primary`, {
        headers: getHeaders(),
      });
      if (!wsRes.ok) return;
      const { id: workspaceId } = await wsRes.json();

      const res = await fetch(
        `${API_BASE_URL}/api/integrations?workspaceId=${encodeURIComponent(workspaceId)}`,
        { headers: getHeaders() }
      );
      if (!res.ok) return;

      const data: { provider: string; status: string }[] = await res.json();
      const next = new Set(
        data
          .filter(d => d.status === "connected")
          .map(d => normalise(d.provider))
      );
      if (mountedRef.current) {
        setConnectedTools(next);
        saveToStorage(next);
      }
    } catch {
      // Silently keep localStorage state when the API is unreachable.
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  /** Immediately mark a provider as connected (optimistic update + localStorage). */
  const markConnected = useCallback((id: string) => {
    const nid = normalise(id);
    setConnectedTools(prev => {
      const next = new Set(prev);
      next.add(nid);
      saveToStorage(next);
      return next;
    });
  }, []);

  /** Immediately mark a provider as disconnected (optimistic update + localStorage). */
  const markDisconnected = useCallback((id: string) => {
    const nid = normalise(id);
    setConnectedTools(prev => {
      const next = new Set(prev);
      next.delete(nid);
      saveToStorage(next);
      return next;
    });
  }, []);

  // Best-effort sync with the API on mount.
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <IntegrationsContext.Provider
      value={{ connectedTools, isLoading, refresh, markConnected, markDisconnected }}
    >
      {children}
    </IntegrationsContext.Provider>
  );
}
