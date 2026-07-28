import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import { apolloClient } from "../lib/apollo";
import { REFRESH_SESSION_MUTATION } from "../lib/queries";
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
  type StoredAuth
} from "../lib/storage";

type AuthContextValue = {
  auth: StoredAuth | null;
  isAuthenticated: boolean;
  login: (auth: StoredAuth) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setAuth(getStoredAuth());
  }, []);

  useEffect(() => {
    if (!auth?.refreshToken) {
      return;
    }

    const refreshAt = auth.accessTokenExpiresAt
      ? new Date(auth.accessTokenExpiresAt).getTime() - 60_000
      : Date.now() + 10 * 60_000;
    const waitMs = Math.max(5_000, refreshAt - Date.now());

    const timer = window.setTimeout(() => {
      void refreshAuthSession(auth);
    }, waitMs);

    return () => window.clearTimeout(timer);
  }, [auth?.accessToken, auth?.accessTokenExpiresAt, auth?.refreshToken]);

  async function refreshAuthSession(currentAuth: StoredAuth) {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      const result = await apolloClient.mutate<{
        refreshSession: {
          accessToken: string;
          refreshToken: string;
          userId: string;
          tenantId: string;
          role: StoredAuth["role"];
          fullName: string;
          driverId?: string;
          assignedVehicleIds?: string[];
          allowAnyVehicle?: boolean;
          mustChangePassword?: boolean;
        };
      }>({
        mutation: REFRESH_SESSION_MUTATION,
        variables: {
          input: {
            refreshToken: currentAuth.refreshToken
          }
        }
      });

      const payload = result.data?.refreshSession;
      if (!payload) {
        throw new Error("Empty refresh payload");
      }

      const nextAuth: StoredAuth = {
        ...currentAuth,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        fullName: payload.fullName,
        driverId: payload.driverId ?? undefined,
        assignedVehicleIds: payload.assignedVehicleIds ?? [],
        allowAnyVehicle: payload.allowAnyVehicle ?? false,
        mustChangePassword: payload.mustChangePassword ?? false
      };

      setStoredAuth(nextAuth);
      setAuth(nextAuth);
    } catch {
      clearStoredAuth();
      setAuth(null);
      void apolloClient.clearStore();
    } finally {
      setIsRefreshing(false);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.accessToken),
      login: (nextAuth) => {
        setStoredAuth(nextAuth);
        setAuth(nextAuth);
      },
      logout: () => {
        clearStoredAuth();
        setAuth(null);
        void apolloClient.clearStore();
      }
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
