import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";

import { apolloClient } from "../lib/apollo";
import { clearMediaToken } from "../lib/media";
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
  isInitializing: boolean;
  login: (auth: StoredAuth) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Bumped on every login/logout. A background refresh started before a
  // logout can still be in flight (and resolve) after clearStoredAuth() ran
  // — without this guard its success handler would silently write a fresh
  // session back to storage, un-doing the logout. Any refresh whose
  // generation no longer matches when it resolves is discarded instead of
  // applied.
  const sessionGenerationRef = useRef(0);
  // The effect below only cancels its timer via cleanup on the *next*
  // render, after setAuth(null) is scheduled — an async gap a login()/
  // logout() call happening synchronously can't close by itself. Keeping
  // the live timer id in a ref lets login/logout clearTimeout it
  // immediately, in the same tick, instead of waiting on React.
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setAuth(getStoredAuth());
    setIsInitializing(false);
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
      refreshTimerRef.current = null;
      void refreshAuthSession(auth);
    }, waitMs);
    refreshTimerRef.current = timer;

    return () => {
      window.clearTimeout(timer);
      if (refreshTimerRef.current === timer) {
        refreshTimerRef.current = null;
      }
    };
  }, [auth?.accessToken, auth?.accessTokenExpiresAt, auth?.refreshToken]);

  function cancelPendingRefresh() {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }

  async function refreshAuthSession(currentAuth: StoredAuth) {
    if (isRefreshing) {
      return;
    }

    const generation = sessionGenerationRef.current;
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

      if (sessionGenerationRef.current !== generation) {
        // Logged out (or a fresh login replaced this session) while the
        // request was in flight — applying it now would resurrect a
        // session the user already ended.
        return;
      }

      const nextAuth: StoredAuth = {
        ...currentAuth,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        // Force recomputation from the new tokens — normalizeStoredAuth
        // only fills these in when absent, and the spread above would
        // otherwise carry over the previous (now stale) token's expiry.
        accessTokenExpiresAt: undefined,
        refreshTokenExpiresAt: undefined,
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        fullName: payload.fullName,
        driverId: payload.driverId ?? undefined,
        assignedVehicleIds: payload.assignedVehicleIds ?? [],
        allowAnyVehicle: payload.allowAnyVehicle ?? false,
        mustChangePassword: payload.mustChangePassword ?? false
      };

      setAuth(setStoredAuth(nextAuth));
    } catch {
      if (sessionGenerationRef.current === generation) {
        clearStoredAuth();
        clearMediaToken();
        setAuth(null);
        void apolloClient.clearStore();
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.accessToken),
      isInitializing,
      login: (nextAuth) => {
        sessionGenerationRef.current += 1;
        cancelPendingRefresh();
        setAuth(setStoredAuth(nextAuth));
      },
      logout: () => {
        sessionGenerationRef.current += 1;
        cancelPendingRefresh();
        clearStoredAuth();
        clearMediaToken();
        setAuth(null);
        void apolloClient.clearStore();
      }
    }),
    [auth, isInitializing]
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
