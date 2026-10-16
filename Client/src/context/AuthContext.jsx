
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch the currently authenticated user.
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      const currentUser = response.data?.user ?? null;

      setUser(currentUser);
      return currentUser;
    } catch (error) {
      setUser(null);
      return null;
    }
  }, []);

  // Check the session once when the provider mounts.
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const response = await api.get("/auth/me");

        if (mounted) {
          setUser(response.data?.user ?? null);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Call this after a successful login API request.
  const login = useCallback((authenticatedUser) => {
    setUser(authenticatedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      // Clear local authentication state.
      setUser(null);
    }
  }, []);

  const value = {
    user,
    setUser,
    authLoading,
    refreshUser,
    login,
    logout,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
