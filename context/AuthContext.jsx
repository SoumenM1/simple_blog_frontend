import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../src/services/api";

const AuthContext = createContext(null);

function getUser(payload) {
  return payload?.data?.user ?? payload?.user ?? payload?.data ?? null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = Boolean(user);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      const currentUser = getUser(response.data);
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const response = await api.get("/auth/me");
        if (active) setUser(getUser(response.data));
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    restoreSession();
    const onExpired = () => setUser(null);
    window.addEventListener("inkline:session-expired", onExpired);
    return () => {
      active = false;
      window.removeEventListener("inkline:session-expired", onExpired);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    let currentUser = getUser(response.data);
    if (!currentUser) {
      const profile = await api.get("/auth/me");
      currentUser = getUser(profile.data);
    }
    console.log("Login successful:", currentUser);
    setUser(currentUser);
    setLoading(false);
    return currentUser;
  }, []);

  const register = useCallback(async (details) => {
    const response = await api.post("/auth/register", details);
    let currentUser = getUser(response.data);
    if (!currentUser) {
      const profile = await api.get("/auth/me");
      currentUser = getUser(profile.data);
    }
    setUser(currentUser);
    setLoading(false);
    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); }
    finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({
    user, loading, isAuthenticated, login, register, logout, refreshUser, setUser,
  }), [user, loading, isAuthenticated, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
