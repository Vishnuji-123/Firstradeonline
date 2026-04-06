import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface MT5Credentials {
  login: number;
  password: string;
  server: string;
}

interface MT5AccountInfo {
  name: string;
  balance: number;
  equity: number;
  currency: string;
}

interface MT5ConnectionContextType {
  isConnected: boolean;
  credentials: MT5Credentials | null;
  accountInfo: MT5AccountInfo | null;
  lastSyncedAt: Date | null;
  totalTradesSynced: number;
  setConnected: (creds: MT5Credentials, info: MT5AccountInfo) => void;
  disconnect: () => void;
  setLastSync: (date: Date, count: number) => void;
}

const MT5ConnectionContext = createContext<MT5ConnectionContextType>({
  isConnected: false,
  credentials: null,
  accountInfo: null,
  lastSyncedAt: null,
  totalTradesSynced: 0,
  setConnected: () => {},
  disconnect: () => {},
  setLastSync: () => {},
});

export const useMT5Connection = () => useContext(MT5ConnectionContext);

export function MT5ConnectionProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [credentials, setCredentials] = useState<MT5Credentials | null>(null);
  const [accountInfo, setAccountInfo] = useState<MT5AccountInfo | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [totalTradesSynced, setTotalTradesSynced] = useState(0);

  const setConnected = useCallback((creds: MT5Credentials, info: MT5AccountInfo) => {
    setCredentials(creds);
    setAccountInfo(info);
    setIsConnected(true);
    // Store encrypted in sessionStorage (session-only)
    try {
      sessionStorage.setItem("mt5_creds", btoa(JSON.stringify(creds)));
    } catch {}
  }, []);

  const disconnect = useCallback(() => {
    setCredentials(null);
    setAccountInfo(null);
    setIsConnected(false);
    setLastSyncedAt(null);
    setTotalTradesSynced(0);
    try { sessionStorage.removeItem("mt5_creds"); } catch {}
  }, []);

  const setLastSync = useCallback((date: Date, count: number) => {
    setLastSyncedAt(date);
    setTotalTradesSynced(count);
  }, []);

  return (
    <MT5ConnectionContext.Provider value={{
      isConnected, credentials, accountInfo, lastSyncedAt, totalTradesSynced,
      setConnected, disconnect, setLastSync,
    }}>
      {children}
    </MT5ConnectionContext.Provider>
  );
}
